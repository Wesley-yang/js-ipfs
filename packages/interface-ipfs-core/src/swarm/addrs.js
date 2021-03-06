/* eslint-env mocha */
'use strict'

const PeerId = require('peer-id')
const { Multiaddr } = require('multiaddr')
const { getDescribe, getIt, expect } = require('../utils/mocha')
const { isWebWorker } = require('ipfs-utils/src/env')
const getIpfsOptions = require('../utils/ipfs-options-websockets-filter-all')

/** @typedef { import("ipfsd-ctl/src/factory") } Factory */
/**
 * @param {Factory} common
 * @param {Object} options
 */
module.exports = (common, options) => {
  const ipfsOptions = getIpfsOptions()
  const describe = getDescribe(options)
  const it = getIt(options)

  describe('.swarm.addrs', function () {
    this.timeout(80 * 1000)

    let ipfsA
    let ipfsB

    before(async () => {
      ipfsA = (await common.spawn({ type: 'proc', ipfsOptions })).api
      // webworkers are not dialable because webrtc is not available
      ipfsB = (await common.spawn({ type: isWebWorker ? 'go' : undefined })).api
      await ipfsA.swarm.connect(ipfsB.peerId.addresses[0])
    })

    after(() => common.clean())

    it('should get a list of node addresses', async () => {
      const peers = await ipfsA.swarm.addrs()
      expect(peers).to.not.be.empty()
      expect(peers).to.be.an('array')

      for (const peer of peers) {
        expect(PeerId.parse(peer.id)).to.be.ok()
        expect(peer).to.have.a.property('addrs').that.is.an('array')

        for (const ma of peer.addrs) {
          expect(Multiaddr.isMultiaddr(ma)).to.be.true()
        }
      }
    })
  })
}
