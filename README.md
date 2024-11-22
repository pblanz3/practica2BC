# Proyecto: Gestión de Skins en Videojuegos

Este proyecto implementa un sistema para la gestión de skins en videojuegos mediante contratos inteligentes en Solidity. Permite realizar operaciones como venta, alquiler y subastas de skins utilizando Ether como moneda.

## Autores
- **Axel Valladares Pazó**  
- **Pedro Blanco Casal**  


---

## Tabla de Contenidos del EJERCICIO 2
1. [Explicación del Código](#explicación-del-código)
2. [Cómo Montarlo](#cómo-montarlo)
3. [Lanzamiento del Código](#lanzamiento-del-código)

   
---

## Explicación del Código

### Smart Contract: Tienda

El contrato inteligente está desarrollado con la finalidad de administrar skins de un videojuegos de forma que el usuario que despliegue el contrato sea el único que cree estas skins y los otros usuarios, hagan de clientes, pudiendo comprarlas, alquilarlas o pujar en una subasta por ellas.

En el código se importa el módulo Ownable de OpenZeppelin, que proporciona una gestión de permisos básicos para un administrador (propietario del contrato). El contrato Tienda hereda de Ownable, permitiendo una administración centralizada para ciertas funciones que veremos posteriormente.

En este sistema, cada skin se define mediante una estructura que contiene información como su identificador, nombre, ubicación del archivo, propietario, precios de compra y alquiler, estado de disponibilidad y datos relacionados con subastas o alquileres. Los skins se almacenan en un mapeo que asocia cada identificador único con su correspondiente estructura. Además, se lleva un conteo total de skins registrados mediante una variable de estado **contadorSkins**. La dirección del administrador del contrato, **admin**, se almacena para gestionar permisos en funciones críticas.

Un modificador garantiza que solo el administrador pueda ejecutar ciertas funciones sensibles, como CrearSkins, MontarSubasta y TerminarSubasta. El contrato tiene un constructor que inicializa los valores clave, como el contador de skins y el administrador, estableciendo al creador del contrato como propietario inicial.

También hay un sistema para asociar archivos a direcciones de usuarios, para almacenar las imagenes de las skins en una red IPFS cuyo propietario es el administrador. 

Se pueden crear las skins, comprarlas, alquilarlas o montar una subasta por ellas.

Cuando deseamos montar la subasta el administrador debe ejecutar **montarSubasta** enviando como parámetro al dirección de la skin creada y el tiempo mínimo, en minutos, que la subasta estará abierta. Tras ello, los clientes podrán pujar, esto devolverá a los anteriores pujadores el dinero que ofrecieron por la skin, através de msg.value, que debe ser obviamente a cada puja un valor mayor.

Cuando el administrador desee acabar la subasta tras el tiempo transcurrido, ejecutará **terminarSubasta** enviando como parámetro al dirección de la skin creada. Esto hará que ya no se pueda pujar más por la skin y enviará al administrador los fondos que haya gastado el último pujador, desde el balance del propio contrato.

Es importante tener en cuenta que por simplificar la complejidad del contrato, el archivo almacenado en la IPFS siempre se almacenará ahí y que cuando un usuario compre la skin correspondiente a dicho archivo, se cambiará de propietario pero la imagen permanecerá en la IPFS.


### Aplicación Web

---

## Cómo Montarlo

Se añade el contrato Tienda.sol en [remix-ethereum](remix.ethereum.org), se compila con la última versión de Solidity. Tras esto, al Desplegarlo, añadimos nuestra Wallet de Metamask.
Copiamos en la página de compilación en el botón **ABI** el contenido de tienda.json y se añade a **ejercicio2/mi-bazar-dapp/src/contracts/src/abis/**.

Además debemos añadir la dirección de la tienda ya desplegada en **ejercicio2/mi-bazar-dapp/src/contracts/src/addresses.js**.

---

## Lanzamiento del Código

Para desplegar y ejecutar la IPFS y la aplicación web:  
1. Asegúrate de tener instalado **Node.js** y **npm** (Node Package Manager).  
2. Debemos tener también el docker de ipfs/kubo desplegado.
3. Ejecutamos dentro de la carpeta **ejercicio2/mi-bazar-dapp** el comando:
   ```bash
   npm install
   
   # y tras ello:
   
   npm start
   
4. Veremos finalmente desplegado el servicio en http://localhost:3000/   


