# Proyecto: Gestión de Skins en Videojuegos

Este proyecto implementa un sistema para la gestión de skins en videojuegos mediante contratos inteligentes en Solidity. Permite realizar operaciones como venta, alquiler y subastas de skins utilizando Ether como moneda.

## Autores
- **Axel Valladares Pazó**  
- **Pedro Blanco Casal**  


---

## Tabla de Contenidos del EJERCICIO 2
1. [Cómo Montarlo](#cómo-montarlo)
2. [Lanzamiento del Código](#lanzamiento-del-código)
3. [Explicación del Código](#explicación-del-código)

---

## Cómo Montarlo

Se añade el contrato Tienda.sol en [remix-ethereum](remix.ethereum.org), se compila con la última versión de Solidity. Tras esto, al Desplegarlo, añadimos nuestra Wallet de Metamask.
Copiamos en la página de compilación en el botón **ABI** el contenido de tienda.json y se añade a **ejercicio2/mi-bazar-dapp/src/contracts/src/abis/**.

Además añadimos la dirección de la tienda ya desplegada en **ejercicio2/mi-bazar-dapp/src/contracts/src/addresses.js**.


---

## Lanzamiento del Código

Para desplegar y ejecutar el contrato inteligente:  
1. Asegúrate de tener instalado **Node.js** y **npm** (Node Package Manager).  
2. Instala **Hardhat** o **Truffle**, según el framework de desarrollo utilizado.  
   ```bash
   npm install --save-dev hardhat
   # o
   npm install -g truffle
   
   
---

## Explicación del Código


