import chai, { expect } from 'chai'
import { Contract, ethers } from 'ethers'
import { solidity, MockProvider, createFixtureLoader } from 'ethereum-waffle'



import { pairFixture } from './shared/fixtures'


const BN = ethers.BigNumber;
chai.use(solidity)

const overrides = {
  gasLimit: 500000
}

describe('UniswapV2Pair', () => {
  const provider = new MockProvider()
  const [wallet, other] = provider.getWallets()
  const loadFixture = createFixtureLoader([wallet],provider)

  let factory: Contract
  let token0: Contract
  let token1: Contract
  let pair: Contract
  beforeEach(async () => {
    const fixture = await loadFixture(pairFixture)
    factory = fixture.factory
    token0 = fixture.token0
    token1 = fixture.token1
    pair = fixture.pair
  })
  it('swap:withoutFee', async () => {
    const token0Amount = ethers.utils.parseEther("5")
    const token1Amount = ethers.utils.parseEther("10")
   
    await addLiquidity(token0Amount, token1Amount)
    const initialFreeFee = await pair._freeFees(wallet.address)
    expect(initialFreeFee.token0FeeFree).to.eq(ethers.utils.parseEther('0'))
    const swapAmount = ethers.utils.parseEther("1")
    
    const expectedOutputAmount = BN.from('453305446940074565')
    await token1.transfer(pair.address, swapAmount)
    await expect(pair.swap(expectedOutputAmount,0, wallet.address, '0x',overrides))
      .to.emit(token0, 'Transfer')
      .withArgs(pair.address, wallet.address, expectedOutputAmount)
    const afterChange = await pair._freeFees(wallet.address)
    expect(afterChange.token0FeeFree).to.equal(expectedOutputAmount)

    const reserves = await pair.getReserves()
   
    let reserveOut = reserves[0]
    let reserveIn = reserves[1]
   
    //With fee expected output
    let expectedAmountTwo = BN.from('994550668459521906')
    //Without fee expected transfer
    let expectedTransfer = BN.from('997271983268164043')
  
    await token0.transfer(pair.address, expectedOutputAmount)
    await expect(pair.swap(0, expectedAmountTwo, wallet.address, '0x',overrides)).to.emit(token1, 'Transfer')
    .withArgs(pair.address, wallet.address, expectedTransfer)
    
    const afterSecondSwap = await pair._freeFees(wallet.address)
    expect(afterSecondSwap.token0FeeFree).to.eq(BN.from('0'))
    expect(afterSecondSwap.token1FeeFree).to.eq(expectedTransfer)

    const reservesAfterSecond = await pair.getReserves()

    let expectedAmountThree = BN.from('1662951447800000000')
 
    await token0.transfer(pair.address, swapAmount)
    await expect(pair.swap(0, expectedAmountThree, wallet.address, '0x',overrides)).to.emit(token1, 'Transfer')
    .withArgs(pair.address, wallet.address, expectedAmountThree)

    const reservesAfterThird = await pair.getReserves()

    const afterThird = await pair._freeFees(wallet.address)
   
    
    
    const expectedAmountFour = BN.from('1583827894833494895')
    const expectedTransferFour = BN.from('1586936173173510706')
    const fourthSwapAmount = ethers.utils.parseEther("3")
    await token1.transfer(pair.address, fourthSwapAmount)
    await expect(pair.swap(expectedAmountFour, 0, wallet.address, '0x',overrides)).to.emit(token0,'Transfer').withArgs(pair.address ,wallet.address,expectedTransferFour)
    const afterFourth = await pair._freeFees(wallet.address)
    expect(afterFourth.token0FeeFree).to.eq(expectedTransferFour)
  
  })
  

  async function addLiquidity(token0Amount:any, token1Amount:any) {
    await token0.transfer(pair.address, token0Amount)
    await token1.transfer(pair.address, token1Amount)
    await pair.mint(wallet.address)
  }
  

  
})
