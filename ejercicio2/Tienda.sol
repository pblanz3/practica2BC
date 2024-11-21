// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

contract Tienda is Ownable {
    struct Skin {
        uint256 id;
        string name;
        string file;
        address propietario;
        uint256 precio_compra;
        uint256 precio_alquiler;
        uint256 tiempo_limite;
        bool en_subasta;
        bool disponible_para_compra;
        bool disponible_para_alquiler;
        address usuario_en_alquiler;
    }

    mapping(uint256 => Skin) public almacenSkins;
    mapping(uint256 => Skin) public subastas;
    uint256 public contadorSkins;
    address public admin;

    modifier soloPropietario {
        require(msg.sender == admin, "No eres el propietario");
        _;
    }

    constructor() Ownable(msg.sender){
        contadorSkins = 0;
        admin = msg.sender; 
    }

    mapping (address => string) public userFiles;
    
    function setFileIPFS(string memory file) external {
        userFiles[msg.sender] = file;
    }
    

    function _crearSkin(string memory _name, string memory _file, uint256 _precio_compra, uint256 _precio_alquiler, bool subastable) external soloPropietario {
        contadorSkins++;
        almacenSkins[contadorSkins] = Skin(
            contadorSkins,
            _name,
            userFiles[msg.sender] = _file,
            admin,
            _precio_compra,
            _precio_alquiler,
            0,
            subastable,
            true,
            true,
            address(0)
        );
    }


    function _comprarSkin(uint256 _id) public payable {
        require(_id <= contadorSkins, "El producto no existe");
        Skin storage skin = almacenSkins[_id];
        require(skin.disponible_para_compra, "Skin no disponible para compra");
        // Verificar si el valor enviado es suficiente para la compra
        //uint dinero_divisor = msg.value;
        require(msg.value >= skin.precio_compra, "No enviaste suficiente cashhh");
        
        // Transferir ETH al propietario (admin)
        //if (msg.value > skin.precio_compra) {
        payable(admin).transfer(msg.value);

        

        skin.propietario = msg.sender;
        skin.disponible_para_compra = false;
        skin.disponible_para_alquiler = false;
        skin.tiempo_limite = 0;
    }


    function _alquilarSkin(uint256 _id, uint256 _diasAlquiler) public payable {
        require(_id <= contadorSkins, "El producto no existe");
        require(_diasAlquiler > 0, "La duracion del alquiler debe ser mayor a 0");

        Skin storage skin = almacenSkins[_id];
        require(skin.disponible_para_compra, "Skin ya vendida");
        require(skin.disponible_para_alquiler, "Skin no disponible para alquiler");
        //require(skin.propietario != msg.sender, "No puedes alquilar tu propia skin");
        //require(skin.propietario == admin, "No puedes alquilar una skin alquilada");
        //require(skin.tiempo_limite < block.timestamp, "Skin ya en alquiler");

        uint costoAlquiler = skin.precio_alquiler * _diasAlquiler;
        require(msg.value >= costoAlquiler, "No se ha enviado suficiente ETH para el alquiler");

        // Transferir ETH al propietario (admin)
        payable(admin).transfer(msg.value);

        skin.disponible_para_compra=false;
        skin.disponible_para_alquiler=false;
        skin.usuario_en_alquiler = msg.sender;
        skin.tiempo_limite = block.timestamp + (_diasAlquiler * 1 days);
    }

    function _devolverSkin(uint256 _id) external {
        require(_id <= contadorSkins, "El producto no existe");
        Skin storage skin = almacenSkins[_id];
        require(skin.usuario_en_alquiler == msg.sender, "No tienes esta skin alquilada");
        //require(block.timestamp > skin.tiempo_limite, "El tiempo de alquiler no ha expirado");
        //skin.propietario = admin;
        skin.disponible_para_alquiler=true;
        skin.disponible_para_compra=true;
        skin.usuario_en_alquiler = address(0);
        skin.tiempo_limite = 0;
    }

    function pujar(uint256 _id) public payable {
        require(_id <= contadorSkins, "El producto no existe");
        Skin storage skin = almacenSkins[_id];
        require(skin.en_subasta, "La skin no esta en subasta");
        require(msg.value > skin.precio_compra, "La puja debe ser mayor al precio actual");

        // Verificar que el valor enviado es suficiente para cubrir la puja
        //require(msg.value >= nuevaPuja, "No se ha enviado suficiente ETH para la puja");
        //payable(skin.propietario).transfer(nuevaPujaReduced);
        if (skin.propietario != admin) {
            payable(skin.propietario).transfer(skin.precio_compra);
        }
        skin.precio_compra = msg.value;
        skin.propietario = msg.sender;
    }


    function terminarSubasta(uint256 _id) external soloPropietario {
        require(_id <= contadorSkins, "El producto no existe");
        Skin storage skin = almacenSkins[_id];
        require(skin.en_subasta, "La skin no esta en subasta");
        require(block.timestamp > skin.tiempo_limite, "Aun no acabo el tiempo de la subasta");

        payable(admin).transfer(skin.precio_compra);
        skin.en_subasta = false;
        skin.disponible_para_alquiler=false;
        skin.disponible_para_compra=false;        
        skin.tiempo_limite = 0;
    }

    function montarSubasta(uint256 _id, uint256 tiempo) external soloPropietario {
        require(_id <= contadorSkins, "El producto no existe");
        Skin storage skin = almacenSkins[_id];
        subastas[_id] = skin;
        //require(skin.disponible_para_compra, "No disponible para venta");
        require(skin.en_subasta, "La skin no esta en subasta");
        skin.tiempo_limite = block.timestamp + (tiempo * 1 minutes);
    }

}
