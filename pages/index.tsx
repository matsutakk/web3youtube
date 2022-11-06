import Head from 'next/head'
import Image from 'next/image'
import styles from '../styles/Home.module.css'

import { ConnectButton} from "@rainbow-me/rainbowkit";
import { useAccount } from 'wagmi';
import { ethers } from 'ethers';

import video from "../data/video"
import videoData from '../data/type';
import { useEffect, useState } from 'react';
import contractAddress from "../const/address.json";
import abi from "../const/abi.json";
import {publicKey} from "../const/paillier";
import { PublicKey } from 'paillier-bigint';
import genreMap from '../data/genre';

export default function Home() {
  const {isConnected} = useAccount();
  const [provider, setProvider] = useState<ethers.providers.Web3Provider | null>(null);

  const connectPage = (): JSX.Element => {
    return (
      <div className={styles.button}>
        <ConnectButton/>
      </div>
    )
  }

  useEffect(() =>{
    const getProvider = async () => {
      const provider = new ethers.providers.Web3Provider(window.ethereum as any);
      await provider.send("eth_requestAccounts", []);
      setProvider(provider);
    }
    getProvider();
  },[isConnected]);

  const videoListPage = (): JSX.Element => {
    return (
        <div className={styles.grid}>
          {video.map((item: videoData, index: number)=>{
            return (
              <a  
                  href={item.link}
                  className={styles.card}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => clickhandler(item.genre)}
                  key={index}
              >
                <h2>{item.title}</h2>
                <img src={item.thumbnail} alt="Logo" style={{width:"250px"}}/>
              </a>
            )
          })}
        </div>
    )
  }

  const clickhandler = async (genre: string) => {

    const pk = new PublicKey(publicKey.n, publicKey.g);
    if(provider !== null){
      const signer = provider?.getSigner()
      const contract = new ethers.Contract(contractAddress.zkML, abi.abi, provider);
      const contractWithSigner = contract.connect(signer);
      let data = [BigInt(0),BigInt(0),BigInt(0),BigInt(0),BigInt(0)];
      const idx = genreMap.get(genre);
      if(idx !== undefined) data[idx]= BigInt(1);
      let cipher = []
      for(let i of data){
          let tmp = pk.encrypt(i).toString(16);
          if(tmp.length % 2 == 1){
              tmp = "0x0" + tmp;
          }else{tmp = "0x" + tmp}
          cipher.push(tmp)
      }
      try{
        const tx = await contractWithSigner.appendData(cipher, "0x"+pk._n2.toString(16), 5, signer.getAddress());
        //console.log(tx);
      }catch(e){
        alert("Please register user to zkML");
        console.log(e);
      }
    }
  }

  return (
    <div className={styles.container}>
      <Head>
        <title>Web3 Youtube</title>
        <meta name="description" content="Tokyo Web3 Hackathon Demo" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className='styels.main'> 
        <h1 className={styles.title}>
          Web3 Youtube
        </h1>
        {!isConnected ? connectPage() : videoListPage()}
      </main>
      
      <footer className={styles.footer}>
        @CopyRight....
      </footer>
    </div>
  )
}
