import chai, { expect } from 'chai'
import { Contract } from 'ethers'
import { solidity, MockProvider, createFixtureLoader } from 'ethereum-waffle'
import { BigNumber, bigNumberify,formatEther} from 'ethers/utils'

import { expandTo18Decimals, mineBlock, encodePrice } from './shared/utilities'
import { pairFixture } from './shared/fixtures'
import { AddressZero } from 'ethers/constants'

const MINIMUM_LIQUIDITY = bigNumberify(10).pow(3)

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
    const token0Amount = expandTo18Decimals(5)
    const token1Amount = expandTo18Decimals(10)
   
    await addLiquidity(token0Amount, token1Amount)
    const initialFreeFee = await pair._freeFees(wallet.address)
    expect(initialFreeFee.token0FeeFree).to.eq(bigNumberify('0'))
    const swapAmount = expandTo18Decimals(1)
    
    const expectedOutputAmount = bigNumberify('453305446940074565')
    await token1.transfer(pair.address, swapAmount)
    await expect(pair.swap(expectedOutputAmount,0, wallet.address, '0x',overrides))
      .to.emit(token0, 'Transfer')
      .withArgs(pair.address, wallet.address, expectedOutputAmount)
    const afterChange = await pair._freeFees(wallet.address)
    expect(afterChange.token0FeeFree).to.equal(expectedOutputAmount)

    const reserves = await pair.getReserves()
    console.log(formatEther(reserves[0]))
    console.log(formatEther(reserves[1]))
    let reserveOut = reserves[0]
    let reserveIn = reserves[1]
    console.log(formatEther(expectedOutputAmount))
    //With fee expected output
    let expectedAmountTwo = bigNumberify('994550668459521906')
    //Without fee expected transfer
    let expectedTransfer = bigNumberify('997271983268164043')
    console.log(formatEther(expectedAmountTwo))
    await token0.transfer(pair.address, expectedOutputAmount)
    await expect(pair.swap(0, expectedAmountTwo, wallet.address, '0x',overrides)).to.emit(token1, 'Transfer')
    .withArgs(pair.address, wallet.address, expectedTransfer)
    
    const afterSecondSwap = await pair._freeFees(wallet.address)
    expect(afterSecondSwap.token0FeeFree).to.eq(bigNumberify('0'))
    expect(afterSecondSwap.token1FeeFree).to.eq(expectedTransfer)

    const reservesAfterSecond = await pair.getReserves()
    console.log(formatEther(reservesAfterSecond[0]))
    console.log(formatEther(reservesAfterSecond[1]))
    let expectedAmountThree = bigNumberify('1662951447800000000')
    console.log(formatEther(expectedAmountThree))
    await token0.transfer(pair.address, swapAmount)
    await expect(pair.swap(0, expectedAmountThree, wallet.address, '0x',overrides)).to.emit(token1, 'Transfer')
    .withArgs(pair.address, wallet.address, expectedAmountThree)

    const reservesAfterThird = await pair.getReserves()
    console.log(formatEther(reservesAfterThird[0]))
    console.log(formatEther(reservesAfterThird[1]))
    const afterThird = await pair._freeFees(wallet.address)
    console.log(formatEther(afterThird.token1FeeFree))
    console.log("burada")
    
    const expectedAmountFour = bigNumberify('1583827894833494895')
    const expectedTransferFour = bigNumberify('1586936173173510706')
    const fourthSwapAmount = expandTo18Decimals(3)
    await token1.transfer(pair.address, fourthSwapAmount)
    await expect(pair.swap(expectedAmountFour, 0, wallet.address, '0x',overrides)).to.emit(token0,'Transfer').withArgs(pair.address ,wallet.address,expectedTransferFour)
    const afterFourth = await pair._freeFees(wallet.address)
    expect(afterFourth.token0FeeFree).to.eq(expectedTransferFour)
  
  })
  

  async function addLiquidity(token0Amount: BigNumber, token1Amount: BigNumber) {
    await token0.transfer(pair.address, token0Amount)
    await token1.transfer(pair.address, token1Amount)
    await pair.mint(wallet.address)
  }
  

  
})
