import React, { useCallback, useEffect, useState } from "react";
import './App.css';
import { create } from 'kubo-rpc-client';
import { ethers } from "ethers";
import { Buffer } from "buffer";

import logo from "./badulaque.jpg";
import { addresses, abis } from "./contracts";

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000000000000000000000000000";

let client;

const defaultProvider = new ethers.providers.Web3Provider(window.ethereum);
const signer = defaultProvider.getSigner();

const contratoMiBazar = new ethers.Contract(
  addresses.direccionTienda,
  abis.miTienda,
  defaultProvider
);

async function readCurrentUserFile() {
  const result = await contratoMiBazar.userFiles(
    defaultProvider.getSigner().getAddress()
  );
  console.log({ result });
  return result;
}

function App() {
  const [connected, setConnected] = useState(false);
  const [skins, setSkins] = useState([]);
  const [userId, setUserId] = useState("");
  const [userRegistered, setUserRegistered] = useState(false);
  const [balance, setBalance] = useState(0);
  const [subastas, setSubastas] = useState([]);
  const [newSkin, setNewSkin] = useState({ nombre: "", compra: "", alquiler: "" });
  const [isAdmin, setIsAdmin] = useState(false);

  const [ipfsHash, setIpfsHash] = useState("");
  const [file, setFile] = useState(null);

  const [adminSkins, setAdminSkins] = useState([]); // Skins del administrador (disponibles para la venta)
  const [userSkins, setUserSkins] = useState([]);
  const [vendidasSkins, setSkinsVendidas] = useState([]);

  


  useEffect(() => {
    async function readFile() {
      const file = await readCurrentUserFile();
      if (file !== ZERO_ADDRESS) setIpfsHash(file); 
    }
    readFile();
  }, []);

  useEffect(() => {
    const connectWallet = async () => {
      if (window.ethereum) {
        await window.ethereum.enable();
        const address = await signer.getAddress();
        setConnected(true);
        const userBalance = await defaultProvider.getBalance(address);
        setBalance(ethers.utils.formatEther(userBalance));
      }
    };
    connectWallet();
  }, []);

  useEffect(() => {
    const init = async () => {
      if (window.ethereum) {
        await window.ethereum.enable();
        const address = await signer.getAddress();
        setConnected(true);
        await checkIfAdmin();
        fetchSkins();
        fetchSubastas();
      }
    };
    init();
  }, []);

  const checkIfAdmin = async () => {
    try {
      const address = await signer.getAddress();
      const ownerAddress = await contratoMiBazar.owner();
      setIsAdmin(address.toLowerCase() === ownerAddress.toLowerCase());
    } catch (error) {
      console.error("Error al verificar si es admin:", error.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      console.log(file);
      const client = await create('/ip4/0.0.0.0/tcp/5001');
      const result = await client.add(file);
      console.log("Archivo añadido a IPFS con CID:", result.cid.toString());
      await client.files.cp(`/ipfs/${result.cid}`, `/${result.cid}`);
      console.log(result.cid);
      await crearSkin(result.cid.toString());
    } catch (error) {
      console.log(error.message);
    }
  };

  const retrieveFile = (e) => {
    const data = e.target.files[0];
    if (!data) {
      console.error("No se seleccionó ningún archivo");
      return;
    }

    const reader = new window.FileReader();
    reader.readAsArrayBuffer(data);
    reader.onloadend = () => {
      console.log("Buffer data: ", Buffer(reader.result));
      setFile(Buffer(reader.result));
    };
    e.preventDefault();
  };

  const crearSkin = async (cid) => {
    if (!newSkin.nombre || !newSkin.compra || !newSkin.alquiler) {
      alert("Completa todos los campos");
      return;
    }
    try {
      const ipfsWithSigner = contratoMiBazar.connect(defaultProvider.getSigner());
          // Convertimos los valores de compra y alquiler a wei
      //const compraEnWei = ethers.utils.parseEther(newSkin.compra.toString());
      const compraEnWei = ethers.BigNumber.from(newSkin.compra); // Usar directamente el valor en wei
      const alquilerEnWei = ethers.BigNumber.from(newSkin.alquiler);      
      //const alquilerEnWei = ethers.utils.parseEther(newSkin.alquiler.toString());
      const tx = await ipfsWithSigner._crearSkin(
        newSkin.nombre,
        cid,
        compraEnWei, // Compra en wei
        alquilerEnWei, // Alquiler en wei
        true
      );
      await tx.wait();
      setIpfsHash(cid);
      alert("Skin creada");
    } catch (error) {
      console.error(error.message);
    }
  };

  const montarSubasta = async (skinId) => {
    try {
          const signer = defaultProvider.getSigner();
    
      // Establecer el contrato con el signer para permitir transacciones
      const contratoMiBazarConSigner = contratoMiBazar.connect(signer);
      const tx = await contratoMiBazarConSigner.montarSubasta(skinId, 5); // 5 minutos
      await tx.wait();
      alert("Subasta creada");
    } catch (error) {
      console.error(error.message);
    }
  };

  const pujar = async (skinId, cantidad) => {
    try {      
      // Asegurarse de que el usuario esté conectado a la wallet
      const signer = defaultProvider.getSigner();
      
      // Establecer el contrato con el signer para permitir transacciones
      const contratoMiBazarConSigner = contratoMiBazar.connect(signer);
      const tx = await contratoMiBazarConSigner.pujar(skinId, {
        value: ethers.utils.parseEther(cantidad.toString()),
      });
      await tx.wait();
      alert("Puja realizada");
    } catch (error) {
      console.error(error.message);
    }
  };

  const terminarSubasta = async (skinId) => {
    try {      
      // Asegurarse de que el usuario esté conectado a la wallet
      const signer = defaultProvider.getSigner();
      
      // Establecer el contrato con el signer para permitir transacciones
      const contratoMiBazarConSigner = contratoMiBazar.connect(signer);

      //Se lanza terminarSubasta del contrato
      const tx = await contratoMiBazarConSigner.terminarSubasta(skinId);
      await tx.wait();
      alert("Puja realizada");
    } catch (error) {
      console.error(error.message);
    }
  };

  const fetchSkins = async () => {
      try {
        const userAddress = await signer.getAddress();
        const totalSkins = await contratoMiBazar.contadorSkins();
        const adminSkinsList = [];
        const userSkinsList = [];
        const skinsVendidas = [];

        for (let i = 1; i <= totalSkins; i++) {
          const skin = await contratoMiBazar.almacenSkins(i);
          const skinData = {
            id: skin.id,
            nombre: skin.name,
            file: skin.file,
            precio_compra: skin.precio_compra,
            precio_alquiler: skin.precio_alquiler,
            propietario: skin.propietario,
          };
          if (skin.propietario === userAddress) {
              userSkinsList.push(skinData);
          } else if(skin.disponible_para_compra){
            if(skin.tiempo_limite.toString()==="0"){
              adminSkinsList.push(skinData);
            }
          } else {
            skinsVendidas.push(skinData);
          }
        }

        setAdminSkins(adminSkinsList);
        setUserSkins(userSkinsList);
        setSkinsVendidas(skinsVendidas);
      } catch (error) {
        console.error("Error al listar skins:", error);
      }
    };


  const fetchSubastas = async () => {
    try {
      const subastaArray = [];
      
      const totalSkins = await contratoMiBazar.contadorSkins();

      for (let i = 1; i <= totalSkins; i++) {
        const subasta = await contratoMiBazar.almacenSkins(i);
        //console.log("El tiempo limite es: "+subasta.tiempo_limite);
        if (subasta.en_subasta===true) { //subastable == true
          if(subasta.tiempo_limite.toString()!=="0"){  //está montada
            subastaArray.push({
              id: subasta.id,
              nombre: subasta.name,
              file: subasta.file,
              precio_compra: subasta.precio_compra
             // precio_actual: subasta.precio_compra,
             // skin: await contratoMiBazar.almacenSkins(subasta.idSkin),
            });
          }
        }
      }
      setSubastas(subastaArray);
    } catch (error) {
      console.error("Error al listar subastas:", error.message);
    }
  };


  const buySkin = async (skinId, price) => {
  try {
    // Asegurarse de que el usuario esté conectado a la wallet
    const signer = defaultProvider.getSigner();
    
    // Establecer el contrato con el signer para permitir transacciones
    const contratoMiBazarConSigner = contratoMiBazar.connect(signer);
    
    // Llamar a la función _comprarSkin del smart contract
    //console.log(price.toString())
    const tx = await contratoMiBazarConSigner._comprarSkin(skinId, {
      value: ethers.utils.parseEther(price.toString()), // Enviar el valor en ETH
    });
    
    // Esperar a que la transacción se confirme
    await tx.wait();
    
    alert("Skin comprada con éxito");
    
    // Actualizar el balance del usuario después de la compra
    const address = await signer.getAddress();
    const userBalance = await defaultProvider.getBalance(address);
    setBalance(ethers.utils.formatEther(userBalance));

    // Opcional: Actualizar las skins disponibles y el estado de la compra
    fetchSkins();
  } catch (error) {
    console.error("Error comprando skin:", error.message);
    alert("Hubo un error al comprar la skin. Por favor, revisa la consola.");
  }
};

  const rentSkin = async (skinId, days, rentPrice) => {
    try {
      const tx = await contratoMiBazar._alquilarSkin(skinId, days, {
        value: ethers.utils.parseEther(rentPrice.toString())
      });
      await tx.wait();
      alert("Skin alquilada con éxito");
    } catch (error) {
      console.error("Error alquilando skin:", error.message);
    }
  };

  useEffect(() => {
    fetchSkins();
  }, [connected]);

 return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <h3>Bienvenido a MiBazar</h3>
        <p>Balance: {balance} ETH</p>

      </header>
        {isAdmin && (
          <div className="admin-panel">
            <h2>Panel de Administrador</h2>
            <div>
              <h4>Crear Skin</h4>
              <input
                type="text"
                placeholder="Nombre Skin"
                onChange={(e) =>
                  setNewSkin({ ...newSkin, nombre: e.target.value })
                }
              />
              <input
                type="text"
                placeholder="Precio Compra en Wei"
                onChange={(e) =>
                  setNewSkin({ ...newSkin, compra: e.target.value })
                }
              />
              <input
                type="text"
                placeholder="Precio Alquiler en Wei"
                onChange={(e) =>
                  setNewSkin({ ...newSkin, alquiler: e.target.value })
                }
              />
              <input type="file" onChange={retrieveFile} />
              <button onClick={handleSubmit}>Subir y Crear Skin</button>
            </div>

            <div>
              <h4>Subastas</h4>
              {skins.map((skin) => (
                <div key={skin.id}>
                  <h5>{skin.nombre}</h5>
                  <button onClick={() => montarSubasta(skin.id)}>
                    Montar Subasta
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

            <div className="main-content">
          {/* Sección: Skins Disponibles */}
          {isAdmin && (
            <section className="skins-vendidas">
              <h2>Skins Vendidas</h2>
              {vendidasSkins.map((skin) => (
                <div key={skin.id} className="skin-card">
                  <img
                    src={`http://127.0.0.1:8080/ipfs/${skin.file}`}
                    alt={skin.nombre}
                    className="skin-image"
                  />
                  <h5>{skin.nombre}</h5>
                  <p>Vendido por: {ethers.utils.formatEther(skin.precio_compra)} ETH</p>
                  <p>Al usuario: {skin.propietario}</p>

                </div>
              ))}
            </section>
          )}
          {!isAdmin && (
            <section className="skins-disponibles">
              <h2>Skins Disponibles</h2>
              {adminSkins.map((skin) => (
                <div key={skin.id} className="skin-card">
                  <img
                    src={`http://127.0.0.1:8080/ipfs/${skin.file}`}
                    alt={skin.nombre}
                    className="skin-image"
                  />
                  <h5>{skin.nombre}</h5>
                  <p>Precio Compra: {ethers.utils.formatEther(skin.precio_compra)} ETH</p>

                  {/* Mostrar botones solo si NO es admin */}
                  {!isAdmin && (
                    <>
                      {/*<button onClick={() => buySkin(skin.id, ethers.utils.formatEther(skin.precio_compra))}>*/}
                      <button onClick={() => {
                        console.log("Valor de compra"+ ethers.utils.formatEther(skin.precio_compra));
                        buySkin(skin.id, ethers.utils.formatEther(skin.precio_compra));
                          }}
                      >
                        Comprar
                      </button>

                    </>
                  )}
                </div>
              ))}
            </section>
          )}

          {/* Sección: Subastas Activas */}
          <section className="subastas-activas">
            <h2>Subastas Activas</h2>
            {subastas.map((subasta) => (
              <div key={subasta.id} className="subasta-card">
                <img
                  src={`http://127.0.0.1:8080/ipfs/${subasta.file}`}
                  alt={subasta.nombre}
                  className="skin-image"
                />
                <h5>{subasta.nombre}</h5>
                <p>Precio Actual: {ethers.utils.formatEther(subasta.precio_compra)} ETH</p>
                {!isAdmin && (
                  <button
                    onClick={() => {
                      // Convertir precio_compra (en wei) a Ether
                      const precioActualEther = ethers.utils.formatEther(subasta.precio_compra);
                      //console.log("Precio Actual="+precioActualEther)
                      // Incrementar en un 10%
                      const precioIncrementadoEther = (parseFloat(precioActualEther) * 1.1).toFixed(18); // Mantén precisión
                      //console.log("Precio Incrementado="+precioIncrementadoEther)
                      // Convertir de nuevo a wei
                      const precioIncrementadoWei = ethers.utils.parseEther(precioIncrementadoEther);
                      //console.log("Precio Incrementado wei="+precioIncrementadoWei)

                      const final = ethers.utils.formatEther(precioIncrementadoWei);
                      console.log("Wei="+final)

                      // Llamar a la función pujar con el precio incrementado en wei
                      pujar(subasta.id, final);
                    }}
                  >
                    Pujar
                  </button>
                )}
                {isAdmin && (
                  <button
                    onClick={() => terminarSubasta(subasta.id)}
                  >
                    Terminar subasta
                  </button>
                )}
              </div>
            ))}
          </section>

          <section className="skins-propias">
            <h2>Mis Skins</h2>
            {userSkins.map((skin) => (
              <div key={skin.id} className="skin-card">
                <img
                  src={`http://127.0.0.1:8080/ipfs/${skin.file}`}
                  alt={skin.nombre}
                  className="skin-image"
                />
                <h5>{skin.nombre}</h5>
                <p>Precio Compra: {ethers.utils.formatEther(skin.precio_compra)} ETH</p>
                {/* Mostrar el botón solo si el usuario es administrador */}
                {isAdmin && (
                  <button onClick={() => montarSubasta(skin.id)}>
                    Montar Subasta
                  </button>
                )}
              </div>
            ))}
          </section>
        </div>
    </div>
  );
}

export default App;