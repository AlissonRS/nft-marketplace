import type { NextPage } from 'next'
import { ethers } from "ethers";
import axios from 'axios';
import Web3Modal from 'web3Modal';

import { nftaddress, nftmarketaddress } from '../config';
import NFT from '../artifacts/contracts/NFT.sol/NFT.json';
import Market from '../artifacts/contracts/NFTMarket.sol/NFTMarket.json';
import { useEffect, useState } from 'react';
import { create } from 'ipfs-http-client';
import { useRouter } from 'next/router';

const client = create({
    url: 'https://ipfs.infura.io:5001/api/v0'
});

const CreatorDashboard: NextPage = () => {
    const [nfts, setNfts] = useState([]);
    const [sold, setSold] = useState([]);
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        loadNFTs();
    }, []);

    const loadNFTs = async () => {
        const web3Modal = new Web3Modal();
        const connection = await web3Modal.connect();
        const provider = new ethers.providers.Web3Provider(connection);
        const signer = provider.getSigner();

        const marketContract = new ethers.Contract(nftmarketaddress, Market.abi, signer);
        const tokenContract = new ethers.Contract(nftaddress, NFT.abi, signer);
        const data = await marketContract.fetchItemsCreated();

        const items = await Promise.all(data.map(async i => {
            const tokenUri = await tokenContract.tokenURI(i.tokenId);
            const meta = await axios.get(tokenUri); // e.g. IFPS
            const price = ethers.utils.formatUnits(i.price.toString(), 'ether');
            let item = {
                price,
                tokenId: i.tokenId.toNumber(),
                seller: i.seller,
                owner: i.owner,
                image: meta.data.image,
                name: meta.data.name,
                description: meta.data.description
            };
            return item;
        }));

        console.log(items)

        const soldItems = items.filter(i => i.sold);
        setNfts(items);
        setSold(soldItems);
        setLoaded(true);
    }

    if (loaded && !nfts.length) return (<h1 className='px-20 py-10 text-3xl'>No assets owned</h1>)

    return (
        <div className="flex justify-center">
            <div className='p-4'>
                <h2 className='text-2xl py-2'>Items Created</h2>
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4'>
                    {nfts.map((nft, i) => (
                        <div key={i} className="border shadow rounded-xl overflow-hidden">
                            <img src={nft.image} className="rounded" />
                            <div className='p-4 bg-black'>
                                <p className="text-2xl font-bold text-white">Price - {nft.price} ETH</p>
                                <div style={{ height: '70px', overflow: 'hidden' }}>
                                    <p className='text-gray-400'>{nft.description}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className='px-4'>
                {sold.length &&
                    <div>
                        <h2 className='text-2xl py-2'>Items Sold</h2>
                        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4'>
                            {sold.map((nft, i) => (
                                <div key={i} className="border shadow rounded-xl overflow-hidden">
                                    <img src={nft.image} className="rounded" />
                                    <div className='p-4 bg-black'>
                                        <p className="text-2xl font-bold text-white">Price - {nft.price} ETH</p>
                                        <div style={{ height: '70px', overflow: 'hidden' }}>
                                            <p className='text-gray-400'>{nft.description}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                    </div>
                }
            </div>
        </div>
    )
}

export default CreatorDashboard
