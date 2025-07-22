const { expect } = require('chai');
const { ethers } = require('hardhat');

const tokens = (n) => {
    return ethers.utils.parseUnits(n.toString(), 'ether')
}

describe('Escrow', () => {
    let buyer, seller, inspector, lender;
    let realEstate, escrow, transaction;

    beforeEach(async () => {
        [buyer, seller, inspector, lender] = await ethers.getSigners();


        const RealEstate = await ethers.getContractFactory('RealEstate');
        realEstate = await RealEstate.deploy();

        // mint

        let transaction = await realEstate.connect(seller).mint({
            "name": "Real Estate #1",
            "description": "A luxury 3-bedroom villa located in Bali with private pool and sea view.",
            "image": "ipfs://QmExampleImageHash/villa.jpg",
            "attributes": [
                {
                    "trait_type": "Location",
                    "value": "Bali"
                },
                {
                    "trait_type": "Bedrooms",
                    "value": 3
                },
                {
                    "trait_type": "Has Pool",
                    "value": "Yes"
                },
                {
                    "trait_type": "View",
                    "value": "Sea View"
                }
            ]
        }
        );

        await transaction.wait();

        const Escrow = await ethers.getContractFactory('Escrow');
        escrow = await Escrow.deploy(realEstate.address, seller.address, inspector.address, lender.address);
        
        // Approve property
        transaction = await realEstate.connect(seller).approve(escrow.address, 1);
        await transaction.wait();

        // List Property
        transaction = await escrow.connect(seller).list(1, buyer.address, tokens(10), tokens(5));
        await transaction.wait();
    })

    describe('Deployment', () => {
        it('Returns NFT address', async () => {
            const result = await escrow.nftAddress();
            expect(result).to.be.equal(realEstate.address);
        })

        it('Returns Seller', async () => {
            const result = await escrow.seller();
            expect(result).to.be.equal(seller.address);
        })

        it('Returns Inspector', async () => {
            const result = await escrow.inspector();
            expect(result).to.be.equal(inspector.address);
        })

        it('Returns Lender', async () => {
            const result = await escrow.lender();
            expect(result).to.be.equal(lender.address);
        })

    })


    describe('Listing', () => {
        it('Updates Ownership', async () => {
            expect(await realEstate.ownerOf(1)).to.be.equal(escrow.address);
        })

        it('Updates as listed', async () => {
            const result = await escrow.isListed(1);
            expect(result).to.be.equal(true);
        })

        it('Returns Buyer', async () => {
            const result = await escrow.buyer(1);
            expect(result).to.be.equal(buyer.address);
        })

        it('Returns Purchase Price', async () => {
            const result = await escrow.purchasePrice(1);
            expect(result).to.be.equal(tokens(10));
        })

        it('Returns Escrow Amount', async () => {
            const result = await escrow.escrowAmount(1);
            expect(result).to.be.equal(tokens(5));
        })

    })


    describe('Deposites', () => {
        it('Updates Contract balance', async () => {
            const transaction = await escrow.connect(buyer).depositeEarnest(1, { value: tokens(5) });
            await transaction.wait();
            const result = await escrow.getBalance();
            expect(result).to.be.equal(tokens(5));
        })
        
    })


    describe('Inspection', () => {
        it('Updates Inspection status', async () => {
            const transaction = await escrow.connect(inspector).updateInspectionStatus(1, true);
            await transaction.wait();
            const result = await escrow.inspectionPassed(1);
            expect(result).to.be.equal(true);
        })
        
    })


    describe('Approval', () => {
        it('Updates approvola status', async () => {
            let transaction = await escrow.connect(buyer).approveSale(1);
            await transaction.wait();
            
            transaction = await escrow.connect(seller).approveSale(1);
            await transaction.wait();

            transaction = await escrow.connect(lender).approveSale(1);
            await transaction.wait();

            expect(await escrow.approval(1, buyer.address)).to.be.equal(true);
            expect(await escrow.approval(1, seller.address)).to.be.equal(true);
            expect(await escrow.approval(1, lender.address)).to.be.equal(true);

        })
        
    })


    describe('Sale', async () => {
        beforeEach(async () => {
            let transaction = await escrow.connect(buyer).depositeEarnest(1, { value: tokens(5) });
            await transaction.wait();
            
            transaction = await escrow.connect(inspector).updateInspectionStatus(1, true);
            await transaction.wait();

            transaction = await escrow.connect(buyer).approveSale(1);
            await transaction.wait();

            transaction = await escrow.connect(seller).approveSale(1);
            await transaction.wait();

            transaction = await escrow.connect(lender).approveSale(1);
            await transaction.wait();

            await lender.sendTransaction({ to: escrow.address, value: tokens(5) });

            transaction = await escrow.connect(lender).finalizeSale(1);
            await transaction.wait();
        })

        it('Updates ownership', async () => {
            expect(await realEstate.ownerOf(1)).to.be.equal(buyer.address);
        })

        it('Updates balance', async () => {
            expect(await escrow.getBalance()).to.be.equal(0);
        })


    })

    // describe('Cancel Sale', async () => {
    //     it("Should refund buyer if inspection failed", async () =>{
    //         await escrow.connect(buyer).depositeEarnest(1, { value: tokens(5) });
    //         await escrow.connect(inspector).updateInspectionStatus(1, false);

    //         const balanceBefore = await ethers.provider.getBalance(buyer.address)
    //         const trx = await escrow.connect(buyer).cancelSale(1);
    //         const receipt = await trx.wait();
    //         const gasUsed = receipt.gasUsed.mul(trx.gasPrice);
    //         const balanceAfter = await escrow.getBalance();
    //         expect(balanceAfter).to.be.equal(0);
            
    //         expect(balanceAfter.add(gasUsed).sub(balanceBefore)).to.equal(tokens(5));

    //     })
    // })
})