import scrapy
import os
import re

class CapturedDataSpider(scrapy.Spider):
    name = "captured_data_spider"

    def __init__(self, spider_path=None, captured_data_dir=None, output_file='processed_credentials.txt', *args, **kwargs):
        super(CapturedDataSpider, self).__init__(*args, **kwargs)
        self.spider_path = spider_path
        self.captured_data_dir = captured_data_dir
        self.output_file = output_file

        # Define possible credential keys
        self.credential_keys = {
            'username': ['username', 'user', 'login', 'email', 'userid'],
            'password': ['password', 'pass', 'pwd', 'secret', 'token']
        }

    def start_requests(self):
        files_to_process = ["credentials.txt", "captured_data.txt"]

        for file_name in files_to_process:
            file_path = os.path.join(self.captured_data_dir, file_name)
            self.log(f"Processing file: {file_path}")
            try:
                with open(file_path, 'r') as f:
                    for line in f:
                        self.process_data(line.strip())
            except FileNotFoundError:
                self.log(f"Error: {file_path} not found.", level=scrapy.log.ERROR)
            except Exception as e:
                self.log(f"Error processing {file_path}: {e}", level=scrapy.log.ERROR)

    def process_data(self, line):
        # Extract credentials using string operations
        credentials = self.extract_credentials(line)
        if credentials:
            for username, password in credentials:
                self.log_credentials(username, password)
        else:
            self.log(f'No credentials found in line: {line}', level=scrapy.log.WARNING)

    def extract_credentials(self, line):
        # Initialize a list to hold found credentials
        found_credentials = []
        pairs = line.split('&')

        # Initialize variables to store found credentials
        username = None
        password = None

        for pair in pairs:
            if '=' in pair:
                key, value = pair.split('=', 1)
                key = key.strip().lower()  # Normalize key to lowercase
                value = value.strip()  # Normalize value

                # Check if the key matches any of the defined credential keys
                if any(key == k for k in self.credential_keys['username']):
                    username = value
                elif any(key == k for k in self.credential_keys['password']):
                    password = value
                
                # If both username and password are found, add them to the list
                if username and password:
                    found_credentials.append((username, password))
                    username = None  # Reset username after capturing
                    password = None  # Reset password after capturing

        return found_credentials

    def log_credentials(self, username, password):
        # Log the credentials to the console and write to a file
        self.log(f'Captured: {username} / {password}')
        try:
            with open(self.output_file, 'a') as f:
                f.write(f'{username} / {password}\n')
            self.log(f'Successfully wrote credentials to {self.output_file}')
        except Exception as e:
            self.log(f"Error writing to file: {e}", level=scrapy.log.ERROR)