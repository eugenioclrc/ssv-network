// Declare imports
import * as helpers from '../helpers/contract-helpers';
import { expect } from 'chai';
import { trackGas, GasGroup } from '../helpers/gas-usage';

// Declare globals
let ssvNetworkContract: any, ssvViews: any;

describe('Register Operator Tests', () => {
  beforeEach(async () => {
    const metadata = (await helpers.initializeContract());
    ssvNetworkContract = metadata.contract;
    ssvViews = metadata.ssvViews;
  });

  it('Register operator emits "OperatorAdded"', async () => {
    const publicKey = helpers.DataGenerator.publicKey(0);
    await expect(ssvNetworkContract.connect(helpers.DB.owners[1]).registerOperator(
      publicKey,
      helpers.CONFIG.minimalOperatorFee,
      ethers.constants.AddressZero
    )).to.emit(ssvNetworkContract, 'OperatorAdded').withArgs(1, helpers.DB.owners[1].address, publicKey, helpers.CONFIG.minimalOperatorFee, false);
  });

  it('Register private operator emits "OperatorAdded"', async () => {
    const publicKey = helpers.DataGenerator.publicKey(0);
    await expect(ssvNetworkContract.connect(helpers.DB.owners[1]).registerOperator(
      publicKey,
      helpers.CONFIG.minimalOperatorFee,
      helpers.DB.owners[1].address
    )).to.emit(ssvNetworkContract, 'OperatorAdded').withArgs(1, helpers.DB.owners[1].address, publicKey, helpers.CONFIG.minimalOperatorFee, true);
  });

  it('Register operator gas limits', async () => {
    await trackGas(ssvNetworkContract.connect(helpers.DB.owners[1]).registerOperator(
      helpers.DataGenerator.publicKey(0),
      helpers.CONFIG.minimalOperatorFee,
      helpers.DB.owners[2].address
    ), [GasGroup.REGISTER_OPERATOR]);
  });

  it('Get operator by id', async () => {
    await ssvNetworkContract.connect(helpers.DB.owners[1]).registerOperator(
      helpers.DataGenerator.publicKey(0),
      helpers.CONFIG.minimalOperatorFee,
      ethers.constants.AddressZero
    );

    expect((await ssvViews.getOperatorById(1))[0]).to.equal(helpers.DB.owners[1].address); // owner
    expect((await ssvViews.getOperatorById(1))[1]).to.equal(helpers.CONFIG.minimalOperatorFee); // fee
    expect((await ssvViews.getOperatorById(1))[2]).to.equal(0); // validatorCount
    expect((await ssvViews.getOperatorById(1))[3]).to.equal(false); // isPrivate
    expect((await ssvViews.getOperatorById(1))[4]).to.equal(true); // active
  });

  it('Get private operator by id', async () => {
    await trackGas(ssvNetworkContract.connect(helpers.DB.owners[1]).registerOperator(
      helpers.DataGenerator.publicKey(0),
      helpers.CONFIG.minimalOperatorFee,
      helpers.DB.owners[2].address
    ), [GasGroup.REGISTER_OPERATOR]);

    expect((await ssvViews.getOperatorById(1))[0]).to.equal(helpers.DB.owners[1].address); // owner
    expect((await ssvViews.getOperatorById(1))[1]).to.equal(helpers.CONFIG.minimalOperatorFee); // fee
    expect((await ssvViews.getOperatorById(1))[2]).to.equal(0); // validatorCount
    expect((await ssvViews.getOperatorById(1))[3]).to.equal(true); // isPrivate
    expect((await ssvViews.getOperatorById(1))[4]).to.equal(true); // active
  });

  it('Get non-existent operator by id', async () => {
    await trackGas(ssvNetworkContract.connect(helpers.DB.owners[1]).registerOperator(
      helpers.DataGenerator.publicKey(0),
      helpers.CONFIG.minimalOperatorFee,
      ethers.constants.AddressZero
    ), [GasGroup.REGISTER_OPERATOR]);

    expect((await ssvViews.getOperatorById(3))[0]).to.equal(ethers.constants.AddressZero); // owner
    expect((await ssvViews.getOperatorById(3))[1]).to.equal(0); // fee
    expect((await ssvViews.getOperatorById(3))[2]).to.equal(0); // validatorCount
    expect((await ssvViews.getOperatorById(1))[3]).to.equal(false); // isPrivate
    expect((await ssvViews.getOperatorById(3))[4]).to.equal(false); // active
  });

  it('Get operator removed by id', async () => {
    await ssvNetworkContract.connect(helpers.DB.owners[1]).registerOperator(
      helpers.DataGenerator.publicKey(0),
      helpers.CONFIG.minimalOperatorFee,
      ethers.constants.AddressZero
    );
    await ssvNetworkContract.connect(helpers.DB.owners[1]).removeOperator(1);

    expect((await ssvViews.getOperatorById(1))[0]).to.equal(helpers.DB.owners[1].address); // owner
    expect((await ssvViews.getOperatorById(1))[1]).to.equal(0); // fee
    expect((await ssvViews.getOperatorById(1))[2]).to.equal(0); // validatorCount
    expect((await ssvViews.getOperatorById(1))[3]).to.equal(false); // isPrivate
    expect((await ssvViews.getOperatorById(1))[4]).to.equal(false); // active
  });

  it('Register an operator with a fee thats too low reverts "FeeTooLow"', async () => {
    await expect(ssvNetworkContract.registerOperator(
      helpers.DataGenerator.publicKey(0),
      '10',
      ethers.constants.AddressZero
    )).to.be.revertedWithCustomError(ssvNetworkContract,'FeeTooLow');
  });
});