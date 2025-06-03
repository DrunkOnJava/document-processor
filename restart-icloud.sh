#!/bin/bash

# Script to restart iCloud processes with verbose monitoring
# Includes system diagnostics and process tracking

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=====================================${NC}"
echo -e "${BLUE}iCloud Process Restart Script${NC}"
echo -e "${BLUE}=====================================${NC}"
echo ""

# Function to check process status
check_process() {
    local process_name=$1
    if pgrep -x "$process_name" > /dev/null; then
        local pid=$(pgrep -x "$process_name" | head -1)
        local cpu=$(ps aux | grep "^[^ ]*[ ]*$pid" | awk '{print $3}')
        local mem=$(ps aux | grep "^[^ ]*[ ]*$pid" | awk '{print $4}')
        echo -e "${GREEN}✓ $process_name is running (PID: $pid, CPU: ${cpu}%, MEM: ${mem}%)${NC}"
    else
        echo -e "${RED}✗ $process_name is not running${NC}"
    fi
}

# Function to show iCloud sync status
show_sync_status() {
    echo -e "\n${YELLOW}Current iCloud Drive Status:${NC}"
    
    # Check if iCloud Drive is enabled
    if defaults read ~/Library/Preferences/MobileMeAccounts.plist Accounts 2>/dev/null | grep -q "MOBILE_DOCUMENTS"; then
        echo -e "${GREEN}✓ iCloud Drive is enabled${NC}"
    else
        echo -e "${RED}✗ iCloud Drive appears to be disabled${NC}"
    fi
    
    # Show disk usage
    local icloud_path="$HOME/Library/Mobile Documents"
    if [ -d "$icloud_path" ]; then
        local size=$(du -sh "$icloud_path" 2>/dev/null | cut -f1)
        echo -e "${BLUE}iCloud Drive local storage: $size${NC}"
    fi
}

# Show current status
echo -e "${YELLOW}=== Current iCloud Process Status ===${NC}"
check_process "bird"
check_process "cloudd"
check_process "fileproviderd"
check_process "CloudKeychainProxy"
check_process "cloudpaird"
check_process "cloudphotod"

# Show current CPU/Memory usage
echo -e "\n${YELLOW}=== Top iCloud-Related Processes by CPU ===${NC}"
ps aux | grep -E "(bird|cloudd|fileproviderd|cloudpaird|cloudphotod)" | grep -v grep | sort -nrk 3 | head -5 | awk '{printf "%-20s %5s%% CPU %5s%% MEM %s\n", $11, $3, $4, $2}'

show_sync_status

# Get user confirmation
echo -e "\n${RED}This will restart all iCloud processes.${NC}"
echo -e "${YELLOW}You may need to enter your password for some operations.${NC}"
echo -n "Continue? (y/n): "
read -r response

if [[ ! "$response" =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Cancelled by user${NC}"
    exit 0
fi

echo -e "\n${YELLOW}=== Starting iCloud Restart Process ===${NC}"

# Kill iCloud processes
echo -e "\n${YELLOW}Step 1: Stopping iCloud processes...${NC}"

# Kill processes in specific order (least critical to most critical)
for process in "cloudphotod" "cloudpaird" "CloudKeychainProxy" "fileproviderd" "cloudd" "bird"; do
    if pgrep -x "$process" > /dev/null; then
        echo -e "Stopping $process..."
        killall "$process" 2>/dev/null
        sleep 0.5
        
        # Force kill if still running
        if pgrep -x "$process" > /dev/null; then
            echo -e "${YELLOW}Force stopping $process...${NC}"
            killall -9 "$process" 2>/dev/null
        fi
        echo -e "${GREEN}✓ $process stopped${NC}"
    else
        echo -e "${YELLOW}$process was not running${NC}"
    fi
done

# Also stop related helper processes
echo -e "\n${YELLOW}Stopping helper processes...${NC}"
killall -9 "com.apple.CloudDocs.MobileDocumentsFileProvider" 2>/dev/null
killall -9 "com.apple.CloudPhotosConfiguration" 2>/dev/null

# Clear caches
echo -e "\n${YELLOW}Step 2: Clearing iCloud caches...${NC}"
rm -rf ~/Library/Caches/CloudKit 2>/dev/null && echo -e "${GREEN}✓ CloudKit cache cleared${NC}"
rm -rf ~/Library/Caches/com.apple.bird 2>/dev/null && echo -e "${GREEN}✓ Bird cache cleared${NC}"
rm -rf ~/Library/Caches/com.apple.cloudd 2>/dev/null && echo -e "${GREEN}✓ Cloudd cache cleared${NC}"

# Wait a moment
echo -e "\n${YELLOW}Waiting for system to settle...${NC}"
sleep 3

# Restart iCloud daemon
echo -e "\n${YELLOW}Step 3: Restarting iCloud daemon...${NC}"
launchctl kickstart -k gui/$(id -u)/com.apple.bird 2>/dev/null && echo -e "${GREEN}✓ Bird daemon restarted${NC}"

# Wait for processes to start
echo -e "\n${YELLOW}Waiting for processes to initialize...${NC}"
for i in {1..10}; do
    echo -n "."
    sleep 1
done
echo ""

# Check new status
echo -e "\n${YELLOW}=== New iCloud Process Status ===${NC}"
check_process "bird"
check_process "cloudd"
check_process "fileproviderd"
check_process "CloudKeychainProxy"
check_process "cloudpaird"
check_process "cloudphotod"

# Show new CPU/Memory usage
echo -e "\n${YELLOW}=== New Process Resource Usage ===${NC}"
ps aux | grep -E "(bird|cloudd|fileproviderd|cloudpaird|cloudphotod)" | grep -v grep | sort -nrk 3 | head -5 | awk '{printf "%-20s %5s%% CPU %5s%% MEM %s\n", $11, $3, $4, $2}'

# Monitor for a few seconds
echo -e "\n${YELLOW}=== Monitoring Process Stability (10 seconds) ===${NC}"
for i in {1..5}; do
    sleep 2
    echo -e "\n${BLUE}Check $i/5:${NC}"
    ps aux | grep -E "(bird|cloudd|fileproviderd)" | grep -v grep | head -3 | awk '{printf "  %-20s %5s%% CPU\n", $11, $3}'
done

show_sync_status

# Final summary
echo -e "\n${GREEN}=====================================${NC}"
echo -e "${GREEN}iCloud processes have been restarted!${NC}"
echo -e "${GREEN}=====================================${NC}"

echo -e "\n${YELLOW}Tips:${NC}"
echo -e "- It may take a few minutes for iCloud to fully sync"
echo -e "- Check System Preferences > Apple ID > iCloud for sync status"
echo -e "- Monitor Activity Monitor for any high CPU usage"
echo -e "- Check Console.app for any iCloud-related errors"

echo -e "\n${BLUE}To check iCloud sync status later, run:${NC}"
echo "brctl status"