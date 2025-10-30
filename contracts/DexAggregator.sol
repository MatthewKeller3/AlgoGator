// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./interfaces/IAMM.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title DexAggregator
 * @notice Aggregates prices across multiple AMM pools to find the best execution rate
 * @dev Implements slippage protection, deadline checks, and reentrancy guards
 */
contract DexAggregator is ReentrancyGuard, Pausable, Ownable {
    // AMM contract addresses (immutable for gas savings)
    address public immutable amm1;
    address public immutable amm2;
    
    // Token addresses (immutable for gas savings)
    address public immutable token1;
    address public immutable token2;
    
    event BestRouteFound(address indexed user, address bestDex, uint256 inputAmount, uint256 outputAmount);
    event SwapExecuted(address indexed user, address tokenIn, address tokenOut, uint256 amountIn, uint256 amountOut, address dexUsed);
    
    error DeadlineExpired();
    error InsufficientOutputAmount();
    error InvalidAmount();
    error InvalidAddress();
    
    /**
     * @notice Initializes the aggregator with two AMMs and two tokens
     * @param _amm1 Address of the first AMM
     * @param _amm2 Address of the second AMM
     * @param _token1 Address of the first token
     * @param _token2 Address of the second token
     */
    constructor(
        address _amm1,
        address _amm2,
        address _token1,
        address _token2
    ) Ownable(msg.sender) {
        if (_amm1 == address(0) || _amm2 == address(0)) revert InvalidAddress();
        if (_token1 == address(0) || _token2 == address(0)) revert InvalidAddress();
        require(_amm1 != _amm2, "AMM addresses must be different");
        
        amm1 = _amm1;
        amm2 = _amm2;
        token1 = _token1;
        token2 = _token2;
    }
    
    /**
     * @notice Compares rates across AMMs for token1 -> token2 swaps
     * @param amount Amount of token1 to swap
     * @return bestDex Address of the AMM with the best rate
     * @return expectedReturn Expected amount of token2 to receive
     */
    function getBestRateToken1ToToken2(uint256 amount) public view returns (address bestDex, uint256 expectedReturn) {
        if (amount == 0) revert InvalidAmount();
        
        uint256 returnAmm1 = IAMM(amm1).getToken2EstimatedReturn(amount);
        uint256 returnAmm2 = IAMM(amm2).getToken2EstimatedReturn(amount);
        
        return returnAmm1 > returnAmm2 ? (amm1, returnAmm1) : (amm2, returnAmm2);
    }
    
    /**
     * @notice Compares rates across AMMs for token2 -> token1 swaps
     * @param amount Amount of token2 to swap
     * @return bestDex Address of the AMM with the best rate
     * @return expectedReturn Expected amount of token1 to receive
     */
    function getBestRateToken2ToToken1(uint256 amount) public view returns (address bestDex, uint256 expectedReturn) {
        if (amount == 0) revert InvalidAmount();
        
        uint256 returnAmm1 = IAMM(amm1).getToken1EstimatedReturn(amount);
        uint256 returnAmm2 = IAMM(amm2).getToken1EstimatedReturn(amount);
        
        return returnAmm1 > returnAmm2 ? (amm1, returnAmm1) : (amm2, returnAmm2);
    }
    
    /**
     * @notice Swaps token1 for token2 using the AMM with the best rate
     * @param amount Amount of token1 to swap
     * @param minAmountOut Minimum amount of token2 to receive (slippage protection)
     * @param deadline Unix timestamp after which the transaction will revert
     * @return received Actual amount of token2 received
     */
    function swapToken1ForToken2(
        uint256 amount,
        uint256 minAmountOut,
        uint256 deadline
    ) external nonReentrant whenNotPaused returns (uint256 received) {
        if (amount == 0) revert InvalidAmount();
        if (block.timestamp > deadline) revert DeadlineExpired();
        
        (address bestDex, uint256 expectedReturn) = getBestRateToken1ToToken2(amount);
        
        emit BestRouteFound(msg.sender, bestDex, amount, expectedReturn);
        
        // Transfer tokens from user to this contract
        IERC20(token1).transferFrom(msg.sender, address(this), amount);
        
        // Approve AMM to spend tokens (exact amount for security)
        IERC20(token1).approve(bestDex, amount);
        
        // Execute swap
        received = IAMM(bestDex).swapToken1(amount);
        
        // Slippage protection
        if (received < minAmountOut) revert InsufficientOutputAmount();
        
        // Transfer received tokens to user
        IERC20(token2).transfer(msg.sender, received);
        
        emit SwapExecuted(msg.sender, token1, token2, amount, received, bestDex);
    }
    
    /**
     * @notice Swaps token2 for token1 using the AMM with the best rate
     * @param amount Amount of token2 to swap
     * @param minAmountOut Minimum amount of token1 to receive (slippage protection)
     * @param deadline Unix timestamp after which the transaction will revert
     * @return received Actual amount of token1 received
     */
    function swapToken2ForToken1(
        uint256 amount,
        uint256 minAmountOut,
        uint256 deadline
    ) external nonReentrant whenNotPaused returns (uint256 received) {
        if (amount == 0) revert InvalidAmount();
        if (block.timestamp > deadline) revert DeadlineExpired();
        
        (address bestDex, uint256 expectedReturn) = getBestRateToken2ToToken1(amount);
        
        emit BestRouteFound(msg.sender, bestDex, amount, expectedReturn);
        
        // Transfer tokens from user to this contract
        IERC20(token2).transferFrom(msg.sender, address(this), amount);
        
        // Approve AMM to spend tokens (exact amount for security)
        IERC20(token2).approve(bestDex, amount);
        
        // Execute swap
        received = IAMM(bestDex).swapToken2(amount);
        
        // Slippage protection
        if (received < minAmountOut) revert InsufficientOutputAmount();
        
        // Transfer received tokens to user
        IERC20(token1).transfer(msg.sender, received);
        
        emit SwapExecuted(msg.sender, token2, token1, amount, received, bestDex);
    }
    
    /**
     * @notice Emergency pause mechanism (owner only)
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @notice Unpause the contract (owner only)
     */
    function unpause() external onlyOwner {
        _unpause();
    }
    
    /**
     * @notice Emergency token recovery (owner only)
     * @dev Should only be used to recover accidentally sent tokens
     * @param token Address of the token to recover
     * @param amount Amount to recover
     */
    function recoverTokens(address token, uint256 amount) external onlyOwner {
        IERC20(token).transfer(owner(), amount);
    }
}