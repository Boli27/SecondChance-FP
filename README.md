# coding-project-template

## Despliegue Backend  

**Paso 1:** Deploy Mongo y configurar la BD (Rellenar según `/util/mongo-import`).  

**Paso 2:** Configurar las variables de entorno según la BD de Mongo desplegada.  

**Paso 3:** Crear la imagen con el Dockerfile de backend.  

**Paso 4:** Aplicar el despliegue del backend con `deployment.yml`.  

---

## Despliegue Frontend  

**Paso 1:** Modificar la variable de entorno según el enlace de despliegue del backend.  

**Paso 2:** Ejecutar:  
```sh
npm install  
npm start
```
**Paso 3:** Crear la imagen con el Dockerfile de front y ejecutar ese front.
