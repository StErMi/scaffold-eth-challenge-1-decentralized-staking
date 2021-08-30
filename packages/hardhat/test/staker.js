const {ethers} = require('hardhat');
const {use, expect} = require('chai');
const {solidity} = require('ethereum-waffle');

use(solidity);

// Utilities methods
const increaseWorldTimeInSeconds = async (seconds, mine = false) => {
  await ethers.provider.send('evm_increaseTime', [seconds]);
  if (mine) {
    await ethers.provider.send('evm_mine', []);
  }
};

describe('Staker dApp', () => {
  let owner;
  let addr1;
  let addr2;
  let addrs;

  let stakerContract;
  let exampleExternalContract;
  let ExampleExternalContractFactory;

  beforeEach(async () => {
    // Deploy ExampleExternalContract contract
    ExampleExternalContractFactory = await ethers.getContractFactory('ExampleExternalContract');
    exampleExternalContract = await ExampleExternalContractFactory.deploy();

    // Deploy Staker Contract
    const StakerContract = await ethers.getContractFactory('Staker');
    stakerContract = await StakerContract.deploy(exampleExternalContract.address);

    // eslint-disable-next-line no-unused-vars
    [owner, addr1, addr2, ...addrs] = await ethers.getSigners();
  });

  describe('Test contract utils methods', () => {
    it('timeLeft() return 0 after deadline', async () => {
      await increaseWorldTimeInSeconds(180, true);

      const timeLeft = await stakerContract.timeLeft();
      expect(timeLeft).to.equal(0);
    });

    it('timeLeft() return correct timeleft after 10 seconds', async () => {
      const secondElapsed = 10;
      const timeLeftBefore = await stakerContract.timeLeft();
      await increaseWorldTimeInSeconds(secondElapsed, true);

      const timeLeftAfter = await stakerContract.timeLeft();
      expect(timeLeftAfter).to.equal(timeLeftBefore.sub(secondElapsed));
    });
  });

  describe('Test stake() method', () => {
    it('Stake event emitted', async () => {
      const amount = ethers.utils.parseEther('0.5');

      await expect(
        stakerContract.connect(addr1).stake({
          value: amount,
        }),
      )
        .to.emit(stakerContract, 'Stake')
        .withArgs(addr1.address, amount);

      // Check that the contract has the correct amount of ETH we just sent
      const contractBalance = await ethers.provider.getBalance(stakerContract.address);
      expect(contractBalance).to.equal(amount);

      // Check that the contract has stored in our balances state the correct amount
      const addr1Balance = await stakerContract.balances(addr1.address);
      expect(addr1Balance).to.equal(amount);
    });

    it('Stake 0.5 ETH from single user', async () => {
      const amount = ethers.utils.parseEther('0.5');
      const tx = await stakerContract.connect(addr1).stake({
        value: amount,
      });
      await tx.wait();

      // Check that the contract has the correct amount of ETH we just sent
      const contractBalance = await ethers.provider.getBalance(stakerContract.address);
      expect(contractBalance).to.equal(amount);

      // Check that the contract has stored in our balances state the correct amount
      const addr1Balance = await stakerContract.balances(addr1.address);
      expect(addr1Balance).to.equal(amount);
    });

    it('Stake reverted if deadline is reached', async () => {
      // Let deadline be reached
      await increaseWorldTimeInSeconds(180, true);

      const amount = ethers.utils.parseEther('0.5');
      await expect(
        stakerContract.connect(addr1).stake({
          value: amount,
        }),
      ).to.be.revertedWith('Deadline is already reached');
    });

    it('Stake reverted if external contract is completed', async () => {
      const amount = ethers.utils.parseEther('1');
      // Complete the stake process
      const txStake = await await stakerContract.connect(addr1).stake({
        value: amount,
      });
      await txStake.wait();

      // execute it
      const txExecute = await stakerContract.connect(addr1).execute();
      await txExecute.wait();

      await expect(
        stakerContract.connect(addr1).stake({
          value: amount,
        }),
      ).to.be.revertedWith('staking process already completed');
    });
  });

  describe('Test execute() method', () => {
    it('execute reverted because stake amount not reached threshold', async () => {
      await expect(stakerContract.connect(addr1).execute()).to.be.revertedWith('Threshold not reached');
    });

    it('execute reverted because external contract already completed', async () => {
      const amount = ethers.utils.parseEther('1');
      await stakerContract.connect(addr1).stake({
        value: amount,
      });
      await stakerContract.connect(addr1).execute();

      await expect(stakerContract.connect(addr1).execute()).to.be.revertedWith('staking process already completed');
    });

    it('execute reverted because deadline is reached', async () => {
      // reach the deadline
      await increaseWorldTimeInSeconds(180, true);

      await expect(stakerContract.connect(addr1).execute()).to.be.revertedWith('Deadline is already reached');
    });

    it('external contract sucessfully completed', async () => {
      const amount = ethers.utils.parseEther('1');
      await stakerContract.connect(addr1).stake({
        value: amount,
      });
      await stakerContract.connect(addr1).execute();

      // it seems to be a waffle bug see https://github.com/EthWorks/Waffle/issues/469
      // test that our Stake Contract has successfully called the external contract's complete function
      // expect('complete').to.be.calledOnContract(exampleExternalContract);

      // check that the external contract is completed
      const completed = await exampleExternalContract.completed();
      expect(completed).to.equal(true);

      // check that the external contract has the staked amount in it's balance
      const externalContractBalance = await ethers.provider.getBalance(exampleExternalContract.address);
      expect(externalContractBalance).to.equal(amount);

      // check that the staking contract has 0 balance
      const contractBalance = await ethers.provider.getBalance(stakerContract.address);
      expect(contractBalance).to.equal(0);
    });
  });

  describe('Test withdraw() method', () => {
    it('Withdraw reverted if deadline is not reached', async () => {
      await expect(stakerContract.connect(addr1).withdraw(addr1.address)).to.be.revertedWith(
        'Deadline is not reached yet',
      );
    });

    it('Withdraw reverted if external contract is completed', async () => {
      // Complete the stake process
      const txStake = await stakerContract.connect(addr1).stake({
        value: ethers.utils.parseEther('1'),
      });
      await txStake.wait();

      // execute it
      const txExecute = await stakerContract.connect(addr1).execute();
      await txExecute.wait();

      // Let time pass
      await increaseWorldTimeInSeconds(180, true);

      await expect(stakerContract.connect(addr1).withdraw(addr1.address)).to.be.revertedWith(
        'staking process already completed',
      );
    });

    it('Withdraw reverted if address has no balance', async () => {
      // Let time pass
      await increaseWorldTimeInSeconds(180, true);

      await expect(stakerContract.connect(addr1).withdraw(addr1.address)).to.be.revertedWith(
        "You don't have balance to withdraw",
      );
    });

    it('Withdraw success!', async () => {
      // Complete the stake process
      const amount = ethers.utils.parseEther('1');
      const txStake = await stakerContract.connect(addr1).stake({
        value: amount,
      });
      await txStake.wait();

      // Let time pass
      await increaseWorldTimeInSeconds(180, true);

      const txWithdraw = await stakerContract.connect(addr1).withdraw(addr1.address);
      await txWithdraw.wait();

      // Check that the balance of the contract is 0
      const contractBalance = await ethers.provider.getBalance(stakerContract.address);
      expect(contractBalance).to.equal(0);

      // Check that the balance of the user is +1
      await expect(txWithdraw).to.changeEtherBalance(addr1, amount);
    });
  });
});
