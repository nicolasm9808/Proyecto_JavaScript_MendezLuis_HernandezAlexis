document.addEventListener('DOMContentLoaded', () => {
    const apiUrl = 'https://swapi.py4e.com/api/';
    const resultadosContenedor = document.getElementById('resultados');
    const filtrosSecundariosContenedor = document.getElementById('filtros-secundarios');
    const modal = document.getElementById('modal');
    const modalTitulo = document.getElementById('modal-titulo');
    const modalImagen = document.getElementById('modal-imagen');
    const modalDetalles = document.getElementById('modal-detalles');
    const cerrarModal = document.getElementById('cerrar-modal');
    const barraBusqueda = document.getElementById('barra-busqueda');
    let paginaActual = 1;
    let categoriaActual = '';
    let datosActuales = [];
    let datosCompletos = {};

    // Función para obtener datos de la API con paginación
    const obtenerDatos = async (categoria, pagina = 1) => {
        try {
            const url = `${apiUrl}${categoria}/?page=${pagina}`;
            console.log(`Haciendo solicitud a: ${url}`);
            const respuesta = await fetch(url);
            if (!respuesta.ok) throw new Error(`HTTP error! status: ${respuesta.status}`);
            const datos = await respuesta.json();
            console.log(`Datos obtenidos de ${categoria}:`, datos);
            return datos;
        } catch (error) {
            console.error('Error al obtener los datos:', error);
            alert(`Error al obtener los datos: ${error.message}`);
            return null;
        }
    };

    // Función para obtener todos los datos de una categoría
    const obtenerTodosLosDatos = async (categoria) => {
        let datosCompletos = [];
        let pagina = 1;
        let datos;
        do {
            datos = await obtenerDatos(categoria, pagina);
            if (datos && datos.results) {
                datosCompletos = datosCompletos.concat(datos.results);
                pagina++;
            }
        } while (datos && datos.next);
        return datosCompletos;
    };

    // Función para obtener la URL de la imagen desde Star Wars Visual Guide
    const obtenerUrlImagen = (categoria, id) => {
        const baseUrl = 'https://starwars-visualguide.com/assets/img/';
        switch (categoria) {
            case 'people':
                return `${baseUrl}characters/${id}.jpg`;
            case 'planets':
                return `${baseUrl}planets/${id}.jpg`;
            case 'starships':
                return `${baseUrl}starships/${id}.jpg`;
            case 'vehicles':
                return `${baseUrl}vehicles/${id}.jpg`;
            case 'species':
                return `${baseUrl}species/${id}.jpg`;
            default:
                return 'https://via.placeholder.com/300?text=Sin+Imagen';
        }
    };

    // Función para mostrar resultados
    const mostrarResultados = (datos, categoria) => {
        if (!datos || datos.length === 0) {
            resultadosContenedor.innerHTML = `<p>No se encontraron resultados para ${categoria}.</p>`;
            return;
        }

        datosActuales = datos; // Almacenar datos actuales

        resultadosContenedor.innerHTML = datos.map((item) => {
            const id = item.url.split('/').filter(Boolean).pop();
            const nombre = item.name || item.title;
            const imagenUrl = obtenerUrlImagen(categoria, id);

            return `
                <div class="card" data-id="${id}" data-categoria="${categoria}">
                    <div class="imagen-contenedor">
                        <img src="${imagenUrl}" alt="${nombre}" onError="this.src='https://via.placeholder.com/300?text=Imagen+No+Disponible';">
                    </div>
                    <h3>${nombre}</h3>
                </div>
            `;
        }).join('');

        const botonAnterior = document.getElementById('boton-anterior');
        const botonSiguiente = document.getElementById('boton-siguiente');

        botonAnterior.style.display = datos.previous ? 'block' : 'none';
        botonSiguiente.style.display = datos.next ? 'block' : 'none';
    };

    // Función para manejar los botones de filtro
    const manejarFiltro = async (categoria) => {
        categoriaActual = categoria;
        datosCompletos[categoria] = await obtenerTodosLosDatos(categoria);
        mostrarResultados(datosCompletos[categoria], categoria);
        mostrarFiltrosSecundarios(categoria);
    };

    // Función para mostrar filtros secundarios
    const mostrarFiltrosSecundarios = (categoria) => {
        filtrosSecundariosContenedor.innerHTML = '';

        const datos = datosCompletos[categoria];

        if (!datos || datos.length === 0) {
            return;
        }

        const filtros = {};
        datos.forEach(item => {
            if (categoria === 'people' && item.gender) {
                filtros[item.gender] = (filtros[item.gender] || 0) + 1;
            }
            if (categoria === 'planets' && item.climate) {
                filtros[item.climate] = (filtros[item.climate] || 0) + 1;
            }
        });

        for (const [valor, cantidad] of Object.entries(filtros)) {
            const botonFiltro = document.createElement('button');
            botonFiltro.textContent = `${valor} (${cantidad})`;
            botonFiltro.classList.add('btn-filtro-secundario');
            botonFiltro.setAttribute('data-filtro', valor);
            botonFiltro.setAttribute('data-categoria', categoria);
            filtrosSecundariosContenedor.appendChild(botonFiltro);
        }

        document.querySelectorAll('.btn-filtro-secundario').forEach((boton) => {
            boton.addEventListener('click', () => {
                const categoria = boton.getAttribute('data-categoria');
                const filtro = boton.getAttribute('data-filtro');
                manejarFiltroSecundario(categoria, filtro);
            });
        });
    };

    const manejarFiltroSecundario = (categoria, filtro) => {
        categoriaActual = categoria;
        const resultadosFiltrados = datosCompletos[categoria].filter(item => {
            if (categoria === 'people' && item.gender === filtro) return true;
            if (categoria === 'planets' && item.climate === filtro) return true;
            return false;
        });
        mostrarResultados(resultadosFiltrados, categoria);
    };

    // Función para mostrar detalles en el modal
    const mostrarDetallesModal = (id, categoria) => {
        console.log(`Obteniendo detalles para ${categoria} con ID ${id}`);
        const item = datosActuales.find(item => item.url.includes(id));
    
        if (!item) {
            modalTitulo.textContent = 'Información no disponible';
            modalImagen.innerHTML = '<p>Imagen no disponible</p>';
            modalDetalles.innerHTML = '<p>Detalles no disponibles.</p>';
            modal.style.display = 'block';
            return;
        }
    
        const nombre = item.name || item.title;
        const imagenUrl = obtenerUrlImagen(categoria, id);
    
        modalTitulo.textContent = nombre;
        modalImagen.innerHTML = `<img src="${imagenUrl}" alt="${nombre}" onError="this.src='https://via.placeholder.com/300?text=Imagen+No+Disponible';">`;
    
        // Generar lista de especificaciones
        const especificaciones = Object.entries(item).map(([clave, valor]) => `
            <li><strong>${clave.charAt(0).toUpperCase() + clave.slice(1)}:</strong> ${valor}</li>
        `).join('');
        
        modalDetalles.innerHTML = `
            <ul id="modal-especificaciones" class="especificaciones-lista">
                ${especificaciones}
            </ul>
        `;
    
        modal.style.display = 'block';
    };

    // Función para manejar el cierre del modal
    const cerrarModalFn = () => {
        modal.style.display = 'none';
    };

    const siguientePagina = async () => {
        if (categoriaActual) {
            paginaActual += 1;
            const datos = await obtenerDatos(categoriaActual, paginaActual);
            if (datos) {
                mostrarResultados(datos, categoriaActual);
            }
        }
    };

    const paginaAnterior = async () => {
        if (categoriaActual) {
            paginaActual -= 1;
            const datos = await obtenerDatos(categoriaActual, paginaActual);
            if (datos) {
                mostrarResultados(datos, categoriaActual);
            }
        }
    };

    // Event listeners
    document.querySelectorAll('.btn-filtro').forEach((boton) => {
        boton.addEventListener('click', () => {
            const categoria = boton.getAttribute('data-categoria');
            manejarFiltro(categoria);
        });
    });

    document.getElementById('boton-anterior').addEventListener('click', paginaAnterior);
    document.getElementById('boton-siguiente').addEventListener('click', siguientePagina);

    resultadosContenedor.addEventListener('click', (event) => {
        const card = event.target.closest('.card');
        if (card) {
            const id = card.getAttribute('data-id');
            const categoria = card.getAttribute('data-categoria');
            mostrarDetallesModal(id, categoria);
        }
    });

    cerrarModal.addEventListener('click', cerrarModalFn);

    // Manejar el evento de búsqueda
    barraBusqueda.addEventListener('input', () => {
        const textoBusqueda = barraBusqueda.value.trim().toLowerCase();
        if (textoBusqueda === '') {
            // Si el campo de búsqueda está vacío, mostrar todos los resultados
            if (categoriaActual) {
                mostrarResultados(datosCompletos[categoriaActual], categoriaActual);
            }
        } else {
            // Filtrar los resultados según el texto de búsqueda
            const resultadosFiltrados = datosActuales.filter(item => {
                const nombre = item.name || item.title;
                return nombre.toLowerCase().includes(textoBusqueda);
            });
            mostrarResultados(resultadosFiltrados, categoriaActual);
        }
    });
});