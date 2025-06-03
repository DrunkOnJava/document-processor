#!/bin/bash

# Script to compress each folder in the Projects copy directory
# with progress monitoring and error handling

SOURCE_DIR="/Users/griffin/Library/Mobile Documents/com~apple~CloudDocs/TimeMachine/Projects copy"
LOG_FILE="$HOME/compress-projects.log"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo "Starting compression of folders in TimeMachine Projects copy" | tee "$LOG_FILE"
echo "Source: $SOURCE_DIR" | tee -a "$LOG_FILE"
echo "Log file: $LOG_FILE" | tee -a "$LOG_FILE"
echo "----------------------------------------" | tee -a "$LOG_FILE"

# Count total directories
TOTAL_DIRS=$(find "$SOURCE_DIR" -maxdepth 1 -type d ! -path "$SOURCE_DIR" | wc -l | tr -d ' ')
echo -e "${YELLOW}Found $TOTAL_DIRS directories to compress${NC}" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"

# Counter for progress
CURRENT=0

# Process each directory
find "$SOURCE_DIR" -maxdepth 1 -type d ! -path "$SOURCE_DIR" | while read -r dir; do
    CURRENT=$((CURRENT + 1))
    DIRNAME=$(basename "$dir")
    ZIP_FILE="${dir}.zip"
    
    # Check if zip already exists
    if [ -f "$ZIP_FILE" ]; then
        echo -e "${YELLOW}[$CURRENT/$TOTAL_DIRS] Skipping '$DIRNAME' - zip already exists${NC}" | tee -a "$LOG_FILE"
        continue
    fi
    
    echo -e "${GREEN}[$CURRENT/$TOTAL_DIRS] Compressing '$DIRNAME'...${NC}" | tee -a "$LOG_FILE"
    
    # Get directory size
    DIR_SIZE=$(du -sh "$dir" 2>/dev/null | cut -f1)
    echo "  Directory size: $DIR_SIZE" | tee -a "$LOG_FILE"
    
    # Start time
    START_TIME=$(date +%s)
    
    # Compress with progress indication
    # Using -q for quiet mode to reduce output, -r for recursive
    if zip -rq "$ZIP_FILE" "$dir" 2>&1 | tee -a "$LOG_FILE"; then
        # Calculate compression time
        END_TIME=$(date +%s)
        DURATION=$((END_TIME - START_TIME))
        
        # Get zip file size
        ZIP_SIZE=$(du -sh "$ZIP_FILE" 2>/dev/null | cut -f1)
        
        echo -e "  ${GREEN}✓ Successfully compressed to $ZIP_SIZE in ${DURATION}s${NC}" | tee -a "$LOG_FILE"
        
        # Remove original directory after successful compression
        echo "  Removing original directory..." | tee -a "$LOG_FILE"
        if rm -rf "$dir"; then
            echo -e "  ${GREEN}✓ Original directory removed${NC}" | tee -a "$LOG_FILE"
        else
            echo -e "  ${RED}✗ Failed to remove original directory${NC}" | tee -a "$LOG_FILE"
        fi
    else
        echo -e "  ${RED}✗ Failed to compress '$DIRNAME'${NC}" | tee -a "$LOG_FILE"
    fi
    
    echo "" | tee -a "$LOG_FILE"
    
    # Show overall progress
    PERCENTAGE=$((CURRENT * 100 / TOTAL_DIRS))
    echo -e "${YELLOW}Overall progress: $PERCENTAGE% ($CURRENT/$TOTAL_DIRS)${NC}" | tee -a "$LOG_FILE"
    echo "========================================" | tee -a "$LOG_FILE"
    echo "" | tee -a "$LOG_FILE"
done

echo -e "${GREEN}Compression complete!${NC}" | tee -a "$LOG_FILE"
echo "Checking results..." | tee -a "$LOG_FILE"

# Count results
ZIPS_CREATED=$(find "$SOURCE_DIR" -maxdepth 1 -name "*.zip" | wc -l | tr -d ' ')
REMAINING_DIRS=$(find "$SOURCE_DIR" -maxdepth 1 -type d ! -path "$SOURCE_DIR" | wc -l | tr -d ' ')

echo -e "${GREEN}Zip files created: $ZIPS_CREATED${NC}" | tee -a "$LOG_FILE"
echo -e "${YELLOW}Remaining directories: $REMAINING_DIRS${NC}" | tee -a "$LOG_FILE"

# Kill mdworker processes to stop indexing
echo "" | tee -a "$LOG_FILE"
echo "Stopping Spotlight indexing processes..." | tee -a "$LOG_FILE"
killall mdworker_shared 2>/dev/null

echo -e "${GREEN}Done! Check $LOG_FILE for full details.${NC}"