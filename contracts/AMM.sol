// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "./Token.sol";
import "./interfaces/IAMM.sol";

/**
 * @title AMM
 * @notice Automated Market Maker using constant product formula (x * y = k)
 * @dev Implements liquidity provision, token swaps, and LP share management
 */
contract AMM is IAMM {
    Token private immutable _token1;
    Token private immutable _token2;

    uint256 public token1Balance;
    uint256 public token2Balance;
    uint256 public K;

    uint256 public totalShares;
    mapping(address => uint256) public shares;
    uint256 private constant PRECISION = 10**18;

    event Swap(
        address user,
        address tokenGive,
        uint256 tokenGiveAmount,
        address tokenGet,
        uint256 tokenGetAmount,
        uint256 token1Balance,
        uint256 token2Balance,
        uint256 timestamp
    );

    constructor(Token _token1Param, Token _token2Param) {
        _token1 = _token1Param;
        _token2 = _token2Param;
    }

    /**
     * @notice Adds liquidity to the pool
     * @param _token1Amount Amount of token1 to deposit
     * @param _token2Amount Amount of token2 to deposit
     * @dev Mints LP shares proportional to the deposit
     */
    function addLiquidity(uint256 _token1Amount, uint256 _token2Amount) external {
        // Deposit Tokens
        require(
            _token1.transferFrom(msg.sender, address(this), _token1Amount),
            "failed to transfer token 1"
        );
        require(
            _token2.transferFrom(msg.sender, address(this), _token2Amount),
            "failed to transfer token 2"
        );

        // Issue Shares
        uint256 share;

        // If first time adding liquidity, make share 100
        if (totalShares == 0) {
            share = 100 * PRECISION;
        } else {
            uint256 share1 = (totalShares * _token1Amount) / token1Balance;
            uint256 share2 = (totalShares * _token2Amount) / token2Balance;
            require(
                (share1 / 10**3) == (share2 / 10**3),
                "must provide equal token amounts"
            );
            share = share1;
        }

        // Manage Pool
        token1Balance += _token1Amount;
        token2Balance += _token2Amount;
        K = token1Balance * token2Balance;

        // Updates shares
        totalShares += share;
        shares[msg.sender] += share;
    }

    /**
     * @notice Calculates required token2 amount for a given token1 deposit
     * @param _token1Amount Amount of token1 to deposit
     * @return token2Amount Required amount of token2 to maintain pool ratio
     */
    function calculateToken2Deposit(uint256 _token1Amount)
        public
        view
        returns (uint256 token2Amount)
    {
        token2Amount = (token2Balance * _token1Amount) / token1Balance;
    }

    /**
     * @notice Calculates required token1 amount for a given token2 deposit
     * @param _token2Amount Amount of token2 to deposit
     * @return token1Amount Required amount of token1 to maintain pool ratio
     */
    function calculateToken1Deposit(uint256 _token2Amount)
        public
        view
        returns (uint256 token1Amount)
    {
        token1Amount = (token1Balance * _token2Amount) / token2Balance;
    }

    /**
     * @notice Calculates output amount for token1 -> token2 swap
     * @param _token1Amount Amount of token1 to swap
     * @return token2Amount Expected amount of token2 to receive
     */
    function calculateToken1Swap(uint256 _token1Amount)
        public
        view
        returns (uint256 token2Amount)
    {
        uint256 token1After = token1Balance + _token1Amount;
        uint256 token2After = K / token1After;
        token2Amount = token2Balance - token2After;

        // Don't let the pool go to 0
        if (token2Amount == token2Balance) {
            token2Amount--;
        }

        require(token2Amount < token2Balance, "swap amount to large");
    }

    /**
     * @notice Executes token1 -> token2 swap
     * @param _token1Amount Amount of token1 to swap
     * @return token2Amount Actual amount of token2 received
     */
    function swapToken1(uint256 _token1Amount)
        external
        returns(uint256 token2Amount)
    {
        // Calculate Token 2 Amount
        token2Amount = calculateToken1Swap(_token1Amount);

        // Do Swap
        _token1.transferFrom(msg.sender, address(this), _token1Amount);
        token1Balance += _token1Amount;
        token2Balance -= token2Amount;
        _token2.transfer(msg.sender, token2Amount);

        // Emit an event
        emit Swap(
            msg.sender,
            address(_token1),
            _token1Amount,
            address(_token2),
            token2Amount,
            token1Balance,
            token2Balance,
            block.timestamp
        );
    }

    /**
     * @notice Calculates output amount for token2 -> token1 swap
     * @param _token2Amount Amount of token2 to swap
     * @return token1Amount Expected amount of token1 to receive
     */
    function calculateToken2Swap(uint256 _token2Amount)
        public
        view
        returns (uint256 token1Amount)
    {
        uint256 token2After = token2Balance + _token2Amount;
        uint256 token1After = K / token2After;
        token1Amount = token1Balance - token1After;

        // Don't let the pool go to 0
        if (token1Amount == token1Balance) {
            token1Amount--;
        }

        require(token1Amount < token1Balance, "swap amount to large");
    }

    /**
     * @notice Executes token2 -> token1 swap
     * @param _token2Amount Amount of token2 to swap
     * @return token1Amount Actual amount of token1 received
     */
    function swapToken2(uint256 _token2Amount)
        external
        returns(uint256 token1Amount)
    {
        // Calculate Token 1 Amount
        token1Amount = calculateToken2Swap(_token2Amount);

        // Do Swap
        _token2.transferFrom(msg.sender, address(this), _token2Amount);
        token2Balance += _token2Amount;
        token1Balance -= token1Amount;
        _token1.transfer(msg.sender, token1Amount);

        // Emit an event
        emit Swap(
            msg.sender,
            address(_token2),
            _token2Amount,
            address(_token1),
            token1Amount,
            token1Balance,
            token2Balance,
            block.timestamp
        );
    }

    /**
     * @notice Calculates token amounts for a given share withdrawal
     * @param _share Amount of LP shares to burn
     * @return token1Amount Amount of token1 to receive
     * @return token2Amount Amount of token2 to receive
     */
    function calculateWithdrawAmount(uint256 _share)
        public
        view
        returns (uint256 token1Amount, uint256 token2Amount)
    {
        require(_share <= totalShares, "must be less than total shares");
        token1Amount = (_share * token1Balance) / totalShares;
        token2Amount = (_share * token2Balance) / totalShares;
    }

    /**
     * @notice Removes liquidity from the pool
     * @param _share Amount of LP shares to burn
     * @return token1Amount Amount of token1 withdrawn
     * @return token2Amount Amount of token2 withdrawn
     */
    function removeLiquidity(uint256 _share)
        external
        returns(uint256 token1Amount, uint256 token2Amount)
    {
        require(
            _share <= shares[msg.sender],
            "cannot withdraw more shares than you have"
        );

        (token1Amount, token2Amount) = calculateWithdrawAmount(_share);

        shares[msg.sender] -= _share;
        totalShares -= _share;

        token1Balance -= token1Amount;
        token2Balance -= token2Amount;
        K = token1Balance * token2Balance;

        _token1.transfer(msg.sender, token1Amount);
        _token2.transfer(msg.sender, token2Amount);
    }

    /**
     * @notice Gets estimated token1 output for a token2 input (used by aggregator)
     * @param _token2Amount Amount of token2 to swap
     * @return Expected amount of token1 to receive
     */
    function getToken1EstimatedReturn(uint256 _token2Amount) external view returns (uint256) {
        return calculateToken2Swap(_token2Amount);
    }
    
    /**
     * @notice Gets estimated token2 output for a token1 input (used by aggregator)
     * @param _token1Amount Amount of token1 to swap
     * @return Expected amount of token2 to receive
     */
    function getToken2EstimatedReturn(uint256 _token1Amount) external view returns (uint256) {
        return calculateToken1Swap(_token1Amount);
    }

    /**
     * @notice Returns the address of token1
     * @return Address of token1 contract
     */
    function token1() external view override returns (address) {
        return address(_token1);
    }

    /**
     * @notice Returns the address of token2
     * @return Address of token2 contract
     */
    function token2() external view override returns (address) {
        return address(_token2);
    }
}
