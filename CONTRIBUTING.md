# 🤝 Contributing to AlgoGator

Thank you for your interest in contributing to AlgoGator! This document provides guidelines and instructions for contributing.

---

## 🎯 Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Focus on what is best for the community
- Show empathy towards other community members

---

## 🚀 Getting Started

### Prerequisites
- Node.js v16+
- Git
- Basic understanding of:
  - Solidity smart contracts
  - React & Redux
  - DeFi concepts

### Setup Development Environment

```bash
# Fork and clone the repository
git clone https://github.com/your-username/algogator.git
cd algogator

# Install dependencies
npm install

# Start local blockchain
npx hardhat node

# In another terminal, deploy contracts
npx hardhat run scripts/deploy_all.js --network localhost

# Run tests to ensure everything works
npx hardhat test

# Start frontend
npm start
```

---

## 📝 How to Contribute

### Reporting Bugs

**Before submitting a bug report:**
1. Check existing issues to avoid duplicates
2. Ensure you're using the latest version
3. Verify the bug in a clean environment

**Include in your bug report:**
- Clear, descriptive title
- Steps to reproduce
- Expected vs actual behavior
- Screenshots if applicable
- Environment details (OS, Node version, etc.)
- Error messages and stack traces

### Suggesting Enhancements

**Enhancement suggestions should include:**
- Clear use case
- Expected benefits
- Potential implementation approach
- Any breaking changes

### Pull Requests

1. **Fork the repository**

2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```

3. **Make your changes**
   - Follow code style guidelines
   - Add/update tests
   - Update documentation

4. **Run tests**
   ```bash
   npx hardhat test
   npm test
   ```

5. **Commit your changes**
   ```bash
   git commit -m "feat: add amazing feature"
   ```

6. **Push to your fork**
   ```bash
   git push origin feature/amazing-feature
   ```

7. **Open a Pull Request**
   - Provide clear description
   - Reference related issues
   - Include screenshots if UI changes

---

## 💻 Development Guidelines

### Smart Contract Development

**Code Style:**
- Follow Solidity style guide
- Use NatSpec comments for all functions
- Include @param and @return tags
- Add event emissions for state changes

**Example:**
```solidity
/**
 * @notice Swaps token1 for token2 using the best AMM
 * @param amount Amount of token1 to swap
 * @param minAmountOut Minimum token2 to receive (slippage protection)
 * @param deadline Transaction deadline timestamp
 * @return received Actual amount of token2 received
 */
function swapToken1ForToken2(
    uint256 amount,
    uint256 minAmountOut,
    uint256 deadline
) external nonReentrant whenNotPaused returns (uint256 received) {
    // Implementation
}
```

**Security:**
- Use OpenZeppelin contracts when possible
- Add reentrancy guards for state-changing functions
- Validate all inputs
- Include require/revert messages
- Use custom errors for gas efficiency

**Testing:**
- Write tests for all new functions
- Include edge cases
- Test failure scenarios
- Aim for >90% coverage

### Frontend Development

**Code Style:**
- Use functional components with hooks
- Follow React best practices
- Use Redux for state management
- Add PropTypes or TypeScript types

**Component Structure:**
```javascript
import { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'

const MyComponent = () => {
  // State
  const [localState, setLocalState] = useState(null)
  
  // Redux
  const globalState = useSelector(state => state.mySlice)
  const dispatch = useDispatch()
  
  // Effects
  useEffect(() => {
    // Side effects
  }, [dependencies])
  
  // Handlers
  const handleAction = async () => {
    // Implementation
  }
  
  // Render
  return (
    <div>
      {/* JSX */}
    </div>
  )
}

export default MyComponent
```

**UI/UX:**
- Use Bootstrap components consistently
- Ensure responsive design
- Add loading states
- Provide clear error messages
- Include success confirmations

---

## 🧪 Testing

### Running Tests

```bash
# All tests
npx hardhat test

# Specific test file
npx hardhat test test/DexAggregator.js

# With gas reporting
REPORT_GAS=true npx hardhat test

# With coverage
npx hardhat coverage
```

### Writing Tests

**Test Structure:**
```javascript
describe('Feature Name', () => {
  let contract, accounts
  
  beforeEach(async () => {
    // Setup
  })
  
  describe('Function Name', () => {
    it('should do something expected', async () => {
      // Arrange
      const input = 123
      
      // Act
      const result = await contract.someFunction(input)
      
      // Assert
      expect(result).to.equal(expectedValue)
    })
    
    it('should revert with invalid input', async () => {
      await expect(
        contract.someFunction(0)
      ).to.be.revertedWith('Error message')
    })
  })
})
```

---

## 📚 Documentation

### Code Comments

- Use `//` for inline comments
- Use `/* */` for block comments
- Use NatSpec for smart contracts
- Explain "why", not "what"

### Documentation Updates

When adding features, update:
- README.md (if user-facing)
- PROJECT_STRUCTURE.md (if structural)
- CHANGELOG.md (all changes)
- Inline code documentation

---

## 🔄 Commit Message Guidelines

Follow conventional commits format:

```
type(scope): subject

body (optional)

footer (optional)
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only
- `style`: Code style (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding/updating tests
- `chore`: Maintenance tasks

**Examples:**
```bash
feat(aggregator): add multi-hop routing support
fix(ui): correct slippage calculation display
docs(readme): update installation instructions
test(amm): add edge case tests for swaps
```

---

## 🏗️ Project Structure

Before contributing, familiarize yourself with:

```
algogator/
├── contracts/         # Solidity smart contracts
├── scripts/          # Deployment scripts
├── test/             # Test suites
├── src/              # React frontend
│   ├── components/   # React components
│   ├── store/        # Redux state
│   └── abis/         # Contract ABIs
├── docs/             # Documentation
└── public/           # Static assets
```

See [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md) for details.

---

## 🔒 Security

### Reporting Security Issues

**DO NOT** create public issues for security vulnerabilities.

Instead:
1. Email security concerns privately
2. Provide detailed description
3. Include steps to reproduce
4. Wait for acknowledgment before disclosure

### Security Best Practices

- Never commit private keys or sensitive data
- Use `.env` for secrets
- Validate all user inputs
- Use security linters (Slither, Mythril)
- Request security review for critical changes

---

## 📋 Checklist Before Submitting PR

- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex code
- [ ] Documentation updated
- [ ] Tests added/updated
- [ ] All tests pass
- [ ] No console.log in production code
- [ ] Git history is clean
- [ ] PR description is clear

---

## 🎯 Priority Areas

Current areas where contributions are especially welcome:

### High Priority
- [ ] Gas optimization improvements
- [ ] Additional test coverage
- [ ] UI/UX enhancements
- [ ] Documentation improvements

### Medium Priority
- [ ] Multi-hop routing implementation
- [ ] Additional AMM support
- [ ] Advanced charts and analytics
- [ ] Mobile responsiveness

### Low Priority
- [ ] Code refactoring
- [ ] Performance optimizations
- [ ] Additional utility functions

---

## 🤔 Questions?

- Check existing [Documentation](docs/)
- Search [Closed Issues](../../issues?q=is%3Aissue+is%3Aclosed)
- Ask in [Discussions](../../discussions)

---

## 🙏 Recognition

Contributors will be:
- Listed in CONTRIBUTORS.md
- Mentioned in release notes
- Credited in relevant documentation

---

## 📜 License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

**Thank you for contributing to AlgoGator! 🎉**
