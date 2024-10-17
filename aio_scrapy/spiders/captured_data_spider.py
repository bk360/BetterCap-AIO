import scrapy

class CapturedDataSpider(scrapy.Spider):
    name = "captured_data_spider"

    def start_requests(self):
        # Path to captured data file from Bettercap
        file_path = "C:/usr/local/share/bettercap/captured_data.txt"
        
        try:
            with open(file_path, 'r') as f:
                for line in f:  # Iterate directly over the file object
                    self.process_data(line)
        except FileNotFoundError:
            self.log(f"Error: {file_path} not found.")
        except Exception as e:
            self.log(f"Error: {e}")

    def process_data(self, line):
        # Extract credentials using string operations
        credentials = self.extract_credentials(line)
        if credentials:
            for username, password in credentials:
                self.log_credentials(username, password)
        else:
            self.log(f'No credentials found in line: {line}')

    def extract_credentials(self, line):
        # Initialize a list to hold found credentials
        found_credentials = []
        
        # Split the line by '&' to handle multiple key-value pairs
        pairs = line.strip().split('&')
        for pair in pairs:
            # Further split each pair by '=' to separate keys and values
            if '=' in pair:
                key, value = pair.split('=', 1)  # Split only on the first '='
                # Check for username/user and password/pass
                if key in ('username', 'user'):
                    username = value
                elif key in ('password', 'pass'):
                    password = value
                    # Only append if both username and password are found
                    if 'username' in locals() and 'password' in locals():
                        found_credentials.append((username, password))
                        # Clear the locals to avoid duplicates on the next iteration
                        del username, password

        return found_credentials

    def log_credentials(self, username, password):
        # Log the credentials to the console and write to a file
        self.log(f'Captured: {username} / {password}')
        try:
            with open('processed_credentials.txt', 'a') as f:
                f.write(f'{username} / {password}\n')
        except Exception as e:
            self.log(f"Error writing to file: {e}")
