#!/bin/bash
cd ../
source .env

# Telos testnet configuration
export RPC_URL_TELOS=$RPC_URL_TELOS
export CHAIN_ID=41

# Colors for output
GREEN='\033[0;32m'
NC='\033[0m' # No Color

echo -e "${GREEN}Deploying contracts to Telos testnet...${NC}"

# 1. Deploy MockERC20
echo -e "${GREEN}1. Deploying MockERC20...${NC}"
forge create --rpc-url $RPC_URL_TELOS \
  --private-key $PRIVATE_KEY \
  --legacy \
  src/MockERC20.sol:MockERC20 \
  --constructor-args "Bounty Point" "Point"

read -p "Enter MockERC20 contract address: " MOCK_TOKEN_ADDRESS

# 2. Deploy QuestWeb Implementation
echo -e "${GREEN}2. Deploying QuestWeb Implementation...${NC}"
forge create --rpc-url $RPC_URL_TELOS \
  --private-key $PRIVATE_KEY \
  --legacy \
  src/QuestWeb.sol:QuestWeb

read -p "Enter QuestWeb Implementation address: " IMPLEMENTATION_ADDRESS

# 3. Deploy QuestWeb Proxy
echo -e "${GREEN}3. Deploying QuestWeb Proxy...${NC}"
INITIALIZE_CALLDATA=$(cast calldata "initialize(address)" $SIGNER_ADDRESS)

forge create --rpc-url $RPC_URL_TELOS \
  --private-key $PRIVATE_KEY \
  --legacy \
  lib/openzeppelin-contracts/contracts/proxy/ERC1967/ERC1967Proxy.sol:ERC1967Proxy \
  --constructor-args $IMPLEMENTATION_ADDRESS $INITIALIZE_CALLDATA

read -p "Enter QuestWeb Proxy address: " PROXY_ADDRESS

# 4. Deploy UserProfile
echo -e "${GREEN}4. Deploying UserProfile...${NC}"
forge create --rpc-url $RPC_URL_TELOS \
  --private-key $PRIVATE_KEY \
  --legacy \
  src/UserProfile.sol:UserProfile \
  --constructor-args $SIGNER_ADDRESS

read -p "Enter UserProfile contract address: " USER_PROFILE_ADDRESS

# Verify contracts
echo -e "${GREEN}Verifying contracts...${NC}"

# 1. Verify MockERC20
echo -e "${GREEN}1. Verifying MockERC20...${NC}"
forge verify-contract \
    --chain-id 41 \
    --num-of-optimizations 200 \
    --verifier sourcify \
    $MOCK_TOKEN_ADDRESS \
    src/MockERC20.sol:MockERC20 \
    --constructor-args $(cast abi-encode "constructor(string,string)" "Bounty Point" "Point")

# 2. Verify QuestWeb Implementation
echo -e "${GREEN}2. Verifying QuestWeb Implementation...${NC}"
forge verify-contract \
    --chain-id 41 \
    --num-of-optimizations 200 \
    --verifier sourcify \
    $IMPLEMENTATION_ADDRESS \
    src/QuestWeb.sol:QuestWeb \
    --constructor-args $(cast abi-encode "constructor()")

# 3. Verify QuestWeb Proxy
echo -e "${GREEN}3. Verifying QuestWeb Proxy...${NC}"
forge verify-contract \
    --chain-id 41 \
    --num-of-optimizations 200 \
    --verifier sourcify \
    $PROXY_ADDRESS \
    lib/openzeppelin-contracts/contracts/proxy/ERC1967/ERC1967Proxy.sol:ERC1967Proxy \
    --constructor-args $(cast abi-encode "constructor(address,bytes)" $IMPLEMENTATION_ADDRESS $INITIALIZE_CALLDATA)

# 4. Verify UserProfile
echo -e "${GREEN}4. Verifying UserProfile...${NC}"
forge verify-contract \
    --chain-id 41 \
    --num-of-optimizations 200 \
    --verifier sourcify \
    $USER_PROFILE_ADDRESS \
    src/UserProfile.sol:UserProfile \
    --constructor-args $(cast abi-encode "constructor(address)" $SIGNER_ADDRESS)

echo -e "${GREEN}Deployment and verification completed!${NC}"

# Print summary
echo -e "${GREEN}Deployment Summary:${NC}"
echo "MockERC20: $MOCK_TOKEN_ADDRESS"
echo "QuestWeb Implementation: $IMPLEMENTATION_ADDRESS"
echo "QuestWeb Proxy: $PROXY_ADDRESS"
echo "UserProfile: $USER_PROFILE_ADDRESS"