# 🏗 scaffold-eth | 🏰 BuidlGuidl

## The goal of the dApp

The end goal of the project is to mimic the Ethereum 2.0 staking contract. The requirements are pretty simple:

- allow anyone to stack ether and track their balance
- if a time and stack amount deadline have reached don’t allow users to withdraw their fund (those found are used for a future project, like the Ethereum PoS)

## What are you going to learn?

- Setup the scaffold-eth project
- Write a Staking Contract
- Call an external Contract
- Create unit test for your Solidity Contract
- Use and test your Contract with a React app on your local machine
- Deploy the staking contract on Ethereum Test Net!

Maybe it’s not so much but you can see this as the first stepping stone of your (and mine) journey.

### Some always useful links that you should always have in mind:

- [Solidity by Example](https://solidity-by-example.org/)
- [Solidity Documentation](https://docs.soliditylang.org/)
- [Hardhat Documentation](https://hardhat.org/getting-started/)
- [Ethers-js Documentation](https://docs.ethers.io/v5/)
- [OpenZeppelin Documentation](https://docs.openzeppelin.com/openzeppelin/)
- [OpenZeppelin Ethernaut tutorial](https://ethernaut.openzeppelin.com/)
- [CryptoZombies Tutorial](https://cryptozombies.io/)

## Setup the project

First of all, we need to set up it. Clone the scaffold-eth repository, switch to the challenge 1 branch and install all the needed dependencies.

    git clone https://github.com/austintgriffith/scaffold-eth.git challenge-1-decentralized-staking
    cd challenge-1-decentralized-staking
    git checkout challenge-1-decentralized-staking
    yarn install

## Overview of the available CLI commands

These commands are not specific for this challenge but are in common with every scaffold-eth project!

`yarn chain`

This command will launch your local hardhat network and configure it to run on [http://localhost:8545](http://localhost:8545/)

`yarn start`

This command will launch your local react website on [http://localhost:3000](http://localhost:3000/)

`yarn deploy`

This command will deploy all your contracts and refresh your react’s app. To be more precise this command will run two javascript scripts (deploy and publish).

So, open three different Terminals and launch those commands. Every time you make a change to your contracts you just need to re-launch your **deploy** command.

## Exercise Part 1: Implement the stake() method

In this part of the exercise, we want to allow users to stake some ETH in our contract and track their balances.

### Important Concepts to master

- [Payable methods](https://solidity-by-example.org/payable/) — when a function is declared as **payable** it means that allows users to send ETH to it.
- [Mapping](https://solidity-by-example.org/mapping/) — it’s one of the variable [types](https://docs.soliditylang.org/en/v0.8.7/types.html) supported by Solidity. It allows you to associate a **key** with a **value**.
- [Events](https://solidity-by-example.org/events/) — events allow the contract to notify other entities (contracts, web3 applications, etc) that something has happened. When you declare an event you can specify at max 3 **indexed** parameters. When a parameter is declared as indexed it allows 3rd-party apps to **filter** events for that specific parameter.

### Exercise implementation

- Declare a mapping to track balances
- Declare constant threshold of 1 ether
- Declare a Stake event that will log the staker address and staking amount
- Implement a payable `stake()` function that will update the staker’s balance

### Contract code updated

{% gist https://gist.github.com/StErMi/a23b9ae7fd49ae3e6f3b18b3815e76d0 %}

Some clarification:

- `uint` and `uint256` are the same (it’s just an alias)
- when a variable is declared public, Solidity will automagically create a getter method for you. This means that it will expose a `yourVariableName()` method to be called
- when you declare a variable without initializing it, it will be initialized to its **default** value based on the variable type
- Solidity exposes some utility units like [wei, ethers, or time units](https://docs.soliditylang.org/en/v0.8.7/units-and-global-variables.html).

Let’s review it:

- We have declared our balances that will track for each user’s address his stacked balance
- We have declared our threshold
- We have declared our Stake event that will notify the blockchain that a user has stacked an amount
- We have implemented our Stake function as a public payable method that will update the user’s balance and will emit the Stake event.

One thing that could be strange is that we are simply updating the value without initializing the default value of `balances[msg.sender]`. That’s possible because when a variable is not initialized it will be created with its type default value. In this case (uint256) it will be 0.

Now, deploy the contract, get some funds from the Faucet and try to stake some ETH to the contract.

- Can you get some funds from the Faucet?
- Can you send 0.5 ETH to the Contract by clicking the Stake button?
- Is the event triggered on the UI?
- Is your staking balance updated?
- Is the contract’s balance updated?

{% youtube KfoNrlYxBKY %}

If you have checked all these marks we can continue to part 2 of the exercise.

## Exercise Part 2: Implement the lock mechanism and withdraw

As we previously said the final goal of this Contract is to create a Staking dApp that will allow public users to stack some ETH if some conditions are met. If those conditions are not met they will be able to withdraw their funds.

These conditions are:

- At least 1 ETH needs to be stacked on the Staker Contract
- The 1 ETH stack threshold is reached within a time deadline of 30 seconds

### Important Concepts to master

- [Call external contract](https://solidity-by-example.org/calling-contract/) — every contract on the blockchain is like a public REST API. You can call them from your web3 app or directly from another contract if they are declared as `public` or `external`
- [Function Modifier](https://solidity-by-example.org/function-modifier/) — Modifiers are code that can be run before and/or after a function call. They can be used to restrict access, validate inputs, or guard against [reentrancy hacks](https://solidity-by-example.org/hacks/re-entrancy/).
- [Error handling](https://solidity-by-example.org/error/) — Error handling is important because allows you to revert the state (to be precise to not apply) of the smart contract. You can think at the revert like a database `rollback`. Errors also allow you to notify the user of the reason for the reversion.
- [Sending Ether (transfer, send, call)](https://solidity-by-example.org/sending-ether/) — Solidity has native methods to transfer ETH from a contract to another contract/user address. TLDR: use **call** ;)

### Exercise implementation

- Declare a 30 seconds deadline from the deploy time of the Contract
- Create a public `timeLeft()` function that will return the amount of time remaining until the deadline is reached
- Create a modifier that will check if the external contract is completed
- Create a modifier that will check dynamically (with a parameter) if the deadline is reached
- Allow users to stake ETH only if the deadline is not reached yet and we have not executed the external contract
- Allow users to withdraw funds only if the deadline is not reached with the balance threshold
- Create an execute() method that will transfer funds from the Staker contract to the external contract and execute an external function from another Contract

> An important note to remember when you are testing your Contract locally. The blockchain state is only updated when blocks are mined. The block number and block timestamp are updated only when a transaction is done. This means that the timeLeft() will be updated only after a transaction. If you want to simulate a “real-life” experience you could change the hardhat config to simulate block auto-mine. Check out their [mining-mode documentation](https://hardhat.org/hardhat-network/reference/#mining-modes) if you want to learn more.

### Contract code updated

{% gist https://gist.github.com/StErMi/e9bba755aa9fe4d206fc0eae710340a4 %}
{% gist https://gist.github.com/CristinaSolana/1885435 %}

### Why is the code different between the one from the original challenge?

- I think that the variable `openForWithdraw` it’s unnecessary in this case. Withdraw can be enabled directly from the status of the Staker Contract and External Contract
- In this case our `withdraw` method is not taking an external address for simplification. You will be the only one to be able to withdraw!
- We have updated both Solidity to version `0.8.4` and Hardhat to version `2.6.1` . Some scaffold-eth (like this one) could still rely on old version of Solidity and I think that’s important to use the most updated one for security, optimization and feature complete reasons.

### Let’s review some code

**Function Modifiers**: First of all you can see that we have created two modifiers. As you have already learned from Solidity by Example, function modifiers are code that can be run before and / or after a function call. In our case we have even added parametric function modifier!

When you have defined a function modifier you can use them appending the name of the modifier after the function name. If the modifier rever, the function is reverted before even running it!

**stake() function:** is the same one as before

**timeLeft() function**: it’s pretty easy, we use the `block.timestamp` value to calculate the seconds remaining before the deadline.

**withdraw() function**: after our modifiers flag pass, we check if the user has balance otherwise we revert. To prevent from [re-entrancy](https://solidity-by-example.org/hacks/re-entrancy/) attack you **should always** modify the state of your contract **before** any call. That’s why we are saving user’s balance in a variable and we update the user’s balance to 0.

**execute() function**: after our modifiers flag pass we call the external contract `complete()` function and we check if everything is successful.

Now deploy the updated contract with `yarn deploy` and test it locally.

1.  Do you see the timeLeft changing as soon as you make a transaction?
2.  Can you Stake ETH after the deadline?
3.  Can you withdraw before the deadline or after the deadline if the contract is executed?
4.  Can you execute the contract even if the threshold is not met?
5.  Can you execute the contract more than once?

{% youtube 193ZeR17dtk %}

## Exercise Part 3: Test Coverage

I know I know, you would like to just deploy your Contract and frontend and start testing it right now on your test-net of choice but… we need to be sure that everything works as expected without monkey-clicking on the UI!

So in the next part of the post, I’m going to cover something that **every** developer should do: cover your Contract logic with tests!

### Waffle

[Waffle](https://ethereum-waffle.readthedocs.io/en/latest/index.html) is a library for writing and testing smart contracts that work with ethers-js like a charm.

> Waffle is packed with tools that help with that. Tests in waffle are written using [Mocha](https://mochajs.org/) alongside with [Chai](https://www.chaijs.com/). You can use a different test environment, but Waffle matchers only work with `chai`.

To test our contract we will use [Chai matchers](https://ethereum-waffle.readthedocs.io/en/latest/matchers.html) that will verify that the conditions we are expecting have been met.

After you have written all your test you just need to type `yarn test` and all your tests will be automatically run against your contract.

I’m not gonna explain how to use the library (you can simply take a look at the code below to have an overview), I will be more focused on the “what should we test”.

We have implemented our Smart Contract with some logic:

- we are tracking user balance in `mapping(address => uint256) public balances`
- we have a minimum `uint256 public constant threshold = 1 ether`
- we have a maximum `uint256 public deadline = block.timestamp + 120 seconds`
- user can call the `stake()` function if the external contract is not `completed` and the `deadline` is not reached yet
- user can call the `execute` method if the external contract is not `completed` and the `deadline` is not reached yet
- user can withdraw their funds if `deadline` has been reached and the external contract is not `completed`
- `timeLeft()` is returning the remaining seconds until `deadline` is reached, after that it should always return `0`

### What you should cover in your test

**PS:** this is my personal approach to testing, if you have suggestions, hit me up on Twitter!

When I write tests what I have in mind is to take an individual function and cover all the edge cases. Try to write your tests answering these questions:

- Have I covered all the **edge cases**?
- Is the function **reverting** when expected?
- Is the function **emitting** the needed **events**?
- With a specific **input**, will the function produce the expected **output**? Will the new **state** of the Contract be shaped as we expect?
- Will the function **returns** (if it returns something) what we are expecting?

### How to simulate blockchain mining in your test

Remember when we said that to correctly simulate `timeLeft()` we had to create transactions or just ask for funds from the Faucet (that’s a transaction as well)? Well, to solve this issue on our test I have implemented a little utility (that you can simply copy/paste in other projects) that do the same thing:

![increaseWorldTimeInSeconds function](https://miro.medium.com/max/700/1*pGqZzGlYEIRXKQ3ZAy4GCw.png)

When you call `increaseWorldTimeInSeconds(10, true)` it will increase the EVM internal timestamp 10 seconds ahead of the current time. After that, if you specify it, it will also mine a block to create a transaction.

The next time that your contract will be called the `block.timestamp` used in `timeLeft()` should be updated.

### Testing the execute() function

Let’s review one test and then I’ll post the entire code explaining only some specific code. The code about is covering the `execute()` function of our code

{% gist https://gist.github.com/StErMi/ec84c0ce2aa1a188ef47793d0b08ffa7 %}

- The first test check that if the `execute()` function is called when the threshold is not reached it will revert the transaction with the correct error message
- The second test is calling two consecutive times the `execute()` function. The staking process is already done and the transaction should be reverted, preventing doing it again.
- The third test is trying to call the `execute()` function after the time deadline. The transaction should revert because you can call the `execute()` function only before the deadline is reached.
- The last test is testing that if all the requirements are met the `execute()` function does not revert and the desired out is reached. After the function call the external contract `completed` variable should be `true`, the External Contract `balance` should be equal to the users staked amount and our contract balance should be equal to `0` (we have transferred all the balance to the external contract).

If everything goes as expected, running `yarn test` should give you this output

![Text executing success!](https://miro.medium.com/max/538/1*tjI_7R3lLSq4SI8EeNstFA.png)

### Test coverage complete code

Here we go with the whole test coverage code

{% gist https://gist.github.com/StErMi/08c8cac98b48f85fa662c32e8d4804f0 %}

Have you noticed that the test code coverage is far bigger than the Contract itself? That’s what we want to see! **Test all the things!**

## Final step: deploy your Contract to the moon (testnet)

Ok, now it’s time. We have implemented our Smart Contract, we have tested the frontend UI, we have covered every edge case with our tests. We are ready to deploy it on the testnet.

Following the [scaffold-eth documentation](https://docs.scaffoldeth.io/scaffold-eth/solidity/deploying-your-contracts), these are the steps we need to follow:

1.  Change the `defaultNetwork` in `packages/hardhat/hardhat.config.js` to the testnet you would like to use (in my case rinkeby)
2.  Updated the `infuriaProjectId` with one created on [Infuria](https://infura.io/)
3.  Generate a deployer account `with yarn generate` . This command should generate two `.txt` file. One that will represent the account address and one with the **seed phrase** of the generated account.
4.  Run `yarn account` to see details of the account like eth balances across different networks.
5.  Make sure that the **mnemonic.txt** and **relative account files** are not pushed with your git repository, otherwise, anyone could get ownership of your Contract!
6.  Fund your deployer account with some funds. You can use an [instant wallet](https://instantwallet.io/) to send funds to the QR code you just saw on your console.
7.  Deploy your contract with `yarn deploy`!

If everything goes well you should see something like this on your console

    yarn run v1.22.10
    $ yarn workspace [@scaffold](http://twitter.com/scaffold)-eth/hardhat deploy
    $ hardhat run scripts/deploy.js && hardhat run scripts/publish.js📡 Deploying...🛰  Deploying: ExampleExternalContract
     📄 ExampleExternalContract deployed to: 0x96918Bd0EeAF5BBe10deD67f796ef44b2f5cb2A3
     🛰  Deploying: Staker
     📄 Staker deployed to: 0x96918Bd0EeAF5BBe10deD67f796ef44b2f5cb2A3
     💾  Artifacts (address, abi, and args) saved to:  packages/hardhat/artifacts/ 💽 Publishing ExampleExternalContract to ../react-app/src/contracts
     📠 Published ExampleExternalContract to the frontend.
     💽 Publishing Staker to ../react-app/src/contracts
     📠 Published Staker to the frontend.
    ✨  Done in 11.09s.

> Deployment metadata is stored in the `/deployments` folder, and automatically copied to `/packages/react-app/src/contracts/hardhat_contracts.json` via the `--export-all` flag in the `yarn deploy` command (see `/packages/hardhat/packagen.json`).

If you want to check the deployed contract you can search for them on the Etherscan Rinkeby site:

- [ExampleExternalContract](https://rinkeby.etherscan.io/address/0x96918Bd0EeAF5BBe10deD67f796ef44b2f5cb2A3)
- [Staker Contract](https://rinkeby.etherscan.io/address/0x3380Be31610732c7DEF9f6862e157e4D3Dfd2481)

### Update your frontend app and deploy it on Surge!

We are going to use the [Surge](https://surge.sh/) method but you could also deploy your app on **AWS S3** or on **IPFS**, that’s up to you!

> In the near future I will try also to add some basic methods to also deploy it to **Vercel** both manually (via CLI) and via GitHub Actions CI/CD.

The [scaffold-eth documentations](https://docs.scaffoldeth.io/scaffold-eth/deployment/shipping-your-app) always come in hand but I will summarize what you should do:

1.  If you are deploying on mainnet you should verify your contract on Etherscan. This procedure will add credibility and trust to your application. If you are interested in doing so just follow [this guide](https://docs.scaffoldeth.io/scaffold-eth/infraestructure/etherscan) for scaffold-eth.
2.  Turn **off Debug Mode** (it prints an awful lot of console.log, something that you don’t want to see in Chrome Developer Console, trust me!). Open `App.jsx` , find `const DEBUG = true;` and turn it to `false`.
3.  Take a look at `App.jsx` and remove all unused code, just be sure to ship only what you really need!
4.  Make sure that your React app is pointing to the correct network (the one you just used to deploy your Contract). Look for `const targetNetwork = NETWORKS[“localhost”];` and replace `localhost` with the network of your contract. In our case, it will be `rinkeby`
5.  Make sure you are using your own nodes and not the ones in Scaffold-eth as they are public and there’s no guarantee they will be taken down or rate limited. Review lines 58 and 59 of `App.jsx`
6.  Update `constants.js` and swap **Infura**, **Etherscan,** and **Blocknative** API Keys if you want to use their services.

Are we ready? Let’s go!

Now build your React App with`yarn build` and when the build script has finished deploy it to Surge with `yarn surge`.

If everything goes well you should see something like this. You dApp is now live on Surge!

![Deploy on Surge.sh success!](https://miro.medium.com/max/700/1*d9a9bJtM4qBvYsytC81JUw.png)

You can checkout our deployed dApp here: [https://woozy-cable.surge.sh/](https://woozy-cable.surge.sh/)

## Recap and Conclusions

That’s what we have learned and done so far

- Clone scaffold-eth challenge repo
- Learned a couple of fundamental concepts (remember to keep reading Solidity by Example, Hardhat documentation, Solidity documentation, Waffle documentation)
- Create a Smart Contract from zero
- Create a full Test Suite for our Contract
- Tested our Contract locally on hardhat network
- Deployed our contract on Rinkeby
- Deployed our dApp on Surge

If everything works as expect, you are ready to make the big jump and deploy everything on Ethereum main net!

GitHub Repo for this project: [scaffold-eth-challenge-1-decentralized-staking](https://github.com/StErMi/scaffold-eth-challenge-1-decentralized-staking)

## Did you like this content? Follow me for more!

- GitHub: [https://github.com/StErMi]
