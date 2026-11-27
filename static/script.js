// Elementos da página utilizados pelo JavaScript
const form = document.getElementById("form-busca");
const tipo = document.getElementById("tipo-busca");
const termo = document.getElementById("termo");
const lista = document.getElementById("lista-resultados");

// Guarda a busca atual e a página em que o usuário está
let buscaAtual = "";
let paginaAtual = 1;
let totalVideos = 0;


/* Realiza a busca escolhida pelo usuário */

form.addEventListener("submit", function(evento) {

    // Impede o formulário de recarregar a página
    evento.preventDefault();

    // Verifica qual tipo de busca foi selecionado
    if (tipo.value === "videos") {

        // Guarda o termo pesquisado e inicia pela primeira página
        buscaAtual = termo.value;
        paginaAtual = 1;

        buscarVideos();

    } else if (tipo.value === "empresas") {

        buscarEmpresas();

    } else {

        // Busca uma empresa diretamente pelo seu ID
        mostrarEmpresa(termo.value);
    }
});


/* ---------- Busca de vídeos ---------- */

async function buscarVideos() {

    // Faz uma requisição para a rota de vídeos da API
    const resposta = await fetch(
        `/videos?busca=${encodeURIComponent(buscaAtual)}&pagina=${paginaAtual}`
    );

    // Converte a resposta JSON para um objeto JavaScript
    const dados = await resposta.json();

    // Separa os vídeos e a quantidade total de resultados
    const videos = dados.videos;
    totalVideos = dados.total;

    // Limpa os resultados anteriores
    lista.innerHTML = "";

    // Verifica se nenhum vídeo foi encontrado
    if (videos.length === 0) {

        lista.innerHTML =
            "<li><button disabled>Nenhum vídeo encontrado.</button></li>";

        return;
    }


    // Percorre os vídeos recebidos e cria um resultado para cada um
    videos.forEach(function(video) {

        const item = document.createElement("li");

        // Monta o conteúdo que será exibido na lista
        item.innerHTML = `
            <button type="button">
                <strong>${video.titulo}</strong>
                <small>${video.duracao} · ${video.empresa}</small>
            </button>
        `;

        // Ao clicar no vídeo, exibe seus detalhes
        item.querySelector("button").onclick = function() {
            mostrarVideo(video);
        };

        lista.appendChild(item);
    });


    // Adiciona os botões de navegação entre as páginas
    adicionarPaginacao();
}


/* ---------- Paginação dos vídeos ---------- */

function adicionarPaginacao() {

    // Define a quantidade de vídeos utilizada pelo projeto
    const videosPorPagina = 5;

    // Calcula o número total de páginas
    const ultimaPagina = Math.ceil(totalVideos / videosPorPagina);

    const item = document.createElement("li");

    item.className = "paginacao";

    // Cria os botões e exibe a página atual
    item.innerHTML = `
        <button type="button" id="anterior"
            ${paginaAtual === 1 ? "disabled" : ""}>
            Anterior
        </button>

        <span>Página ${paginaAtual} de ${ultimaPagina}</span>

        <button type="button" id="proxima"
            ${paginaAtual === ultimaPagina ? "disabled" : ""}>
            Próxima
        </button>
    `;

    lista.appendChild(item);


    // Volta uma página e realiza uma nova busca
    document.getElementById("anterior").onclick = function() {

        paginaAtual--;

        buscarVideos();
    };


    // Avança uma página e realiza uma nova busca
    document.getElementById("proxima").onclick = function() {

        paginaAtual++;

        buscarVideos();
    };
}


/* ---------- Seleção de vídeo ---------- */

async function mostrarVideo(video) {

    // Define o vídeo selecionado no player do YouTube
    document.getElementById("player-youtube").src =
        `https://www.youtube-nocookie.com/embed/${video.youtube_id}`;

    // Exibe as informações básicas do vídeo
    document.getElementById("titulo-video").textContent =
        video.titulo;

    document.getElementById("info-video").textContent =
        `Lançamento: ${video.lancamento} · Empresa: ${video.empresa}`;


    // Busca a empresa relacionada ao vídeo
    const resposta = await fetch(
        `/empresas/${video.empresa_id}`
    );

    // Converte a resposta JSON para um objeto JavaScript
    const empresa = await resposta.json();

    // Exibe os dados da empresa
    mostrarEmpresaDetalhes(empresa);


    // Procura, entre os lançamentos da empresa,
    // aquele relacionado ao vídeo selecionado
    const lancamento = empresa.lancamentos.find(function(item) {

        return item.id === video.lancamento_id;
    });

    // Exibe o lançamento encontrado
    if (lancamento) {
        mostrarLancamento(lancamento);
    }
}


/* ---------- Busca de empresas ---------- */

async function buscarEmpresas() {

    // Faz uma requisição para buscar empresas pelo nome
    const resposta = await fetch(
        `/empresas?busca=${encodeURIComponent(termo.value)}`
    );

    // Converte a resposta JSON para um objeto JavaScript
    const empresas = await resposta.json();

    // Limpa os resultados anteriores
    lista.innerHTML = "";

    // Verifica se nenhuma empresa foi encontrada
    if (empresas.length === 0) {

        lista.innerHTML =
            "<li><button disabled>Nenhuma empresa encontrada.</button></li>";

        return;
    }


    // Percorre as empresas encontradas
    empresas.forEach(function(empresa) {

        const item = document.createElement("li");

        // Cria o resultado da empresa
        item.innerHTML = `
            <button type="button">
                <strong>${empresa.nome}</strong>
                <small>${empresa.descricao}</small>
            </button>
        `;

        // Ao clicar, busca os detalhes da empresa
        item.querySelector("button").onclick = function() {
            mostrarEmpresa(empresa.id);
        };

        lista.appendChild(item);
    });
}


/* ---------- Busca de empresa por ID ---------- */

async function mostrarEmpresa(id) {

    // Busca uma empresa diretamente pelo seu ID
    const resposta = await fetch(
        `/empresas/${encodeURIComponent(id)}`
    );

    // Verifica se a empresa não foi encontrada
    if (!resposta.ok) {

        lista.innerHTML =
            "<li><button disabled>Empresa não encontrada.</button></li>";

        return;
    }

    // Converte a resposta JSON para um objeto JavaScript
    const empresa = await resposta.json();

    // Exibe os dados da empresa
    mostrarEmpresaDetalhes(empresa);

    // Remove qualquer vídeo que esteja sendo exibido
    document.getElementById("player-youtube").src = "";

    // Exibe o nome da empresa na área do player
    document.getElementById("titulo-video").textContent =
        empresa.nome;

    // Informa a quantidade de lançamentos associados
    document.getElementById("info-video").textContent =
        `${empresa.lancamentos.length} lançamento(s)`;


    // Limpa os resultados anteriores
    lista.innerHTML = "";

    // Exibe os lançamentos relacionados à empresa
    empresa.lancamentos.forEach(function(lancamento) {

        const item = document.createElement("li");

        item.innerHTML = `
            <button type="button">
                <strong>${lancamento.nome}</strong>
                <small>${lancamento.status} · ${lancamento.foguete}</small>
            </button>
        `;

        // Ao clicar, exibe os detalhes do lançamento
        item.querySelector("button").onclick = function() {
            mostrarLancamento(lancamento);
        };

        lista.appendChild(item);
    });
}


/* ---------- Exibição dos detalhes ---------- */

function mostrarEmpresaDetalhes(empresa) {

    // Preenche os campos de informações da empresa
    document.getElementById("empresa-nome").textContent =
        empresa.nome;

    document.getElementById("empresa-descricao").textContent =
        empresa.descricao;
}


function mostrarLancamento(lancamento) {

    // Preenche os campos de informações do lançamento
    document.getElementById("lancamento-nome").textContent =
        lancamento.nome;

    document.getElementById("lancamento-data").textContent =
        lancamento.data;

    document.getElementById("lancamento-foguete").textContent =
        lancamento.foguete;

    document.getElementById("lancamento-missao").textContent =
        lancamento.missao;

    document.getElementById("lancamento-local").textContent =
        lancamento.local;

    document.getElementById("lancamento-status").textContent =
        lancamento.status;

    document.getElementById("lancamento-descricao").textContent =
        lancamento.descricao;
}


/* ---------- Autenticação, lançamentos e cadastro de vídeos ---------- */

// Elementos do cabeçalho
const areaDeslogado = document.getElementById("auth-deslogado");
const areaLogado = document.getElementById("auth-logado");
const usuarioNome = document.getElementById("usuario-nome");

// Modais e formulários
const modalLogin = document.getElementById("modal-login");
const modalCadastro = document.getElementById("modal-cadastro");
const formLogin = document.getElementById("form-login");
const formCadastro = document.getElementById("form-cadastro");
const formVideo = document.getElementById("form-video");
const secaoNovoVideo = document.getElementById("secao-novo-video");

const loginMsg = document.getElementById("login-msg");
const cadastroMsg = document.getElementById("cadastro-msg");
const videoMsg = document.getElementById("video-msg");

const listaLancamentos = document.getElementById("lista-lancamentos");
const selectLancamento = document.getElementById("video-lancamento");


/* ---------- Funções auxiliares ---------- */

// Envia JSON para a API e devolve sempre um objeto padronizado
async function enviarJson(url, metodo, corpo) {

    try {

        const resposta = await fetch(url, {
            method: metodo,
            headers: { "Content-Type": "application/json" },
            body: corpo ? JSON.stringify(corpo) : undefined
        });

        let dados = {};

        try {
            dados = await resposta.json();
        } catch (erro) {
            // Resposta sem JSON: mantém o objeto vazio
        }

        return { ok: resposta.ok, status: resposta.status, dados: dados };

    } catch (erro) {

        return {
            ok: false,
            status: 0,
            dados: { erro: "Falha de conexão com o servidor." }
        };
    }
}


// Exibe uma mensagem de erro ou sucesso em um elemento <p class="mensagem">
function mostrarMensagem(elemento, texto, tipo) {

    elemento.textContent = texto;
    elemento.className = "mensagem" + (texto ? " " + tipo : "");
}


// Limpa e abre um modal
function abrirModal(modal, formulario, mensagem) {

    formulario.reset();
    mostrarMensagem(mensagem, "", "");

    modal.showModal();
}


/* ---------- Estado de autenticação ---------- */

function atualizarAutenticacao(autenticado, nome) {

    // Alterna entre os botões de visitante e de usuário logado
    areaDeslogado.hidden = autenticado;
    areaLogado.hidden = !autenticado;

    // Somente usuários logados podem adicionar vídeos
    secaoNovoVideo.hidden = !autenticado;

    usuarioNome.textContent = autenticado ? `Olá, ${nome}` : "";
}


async function verificarSessao() {

    const resposta = await enviarJson("/auth/me", "GET");

    atualizarAutenticacao(
        resposta.dados.autenticado === true,
        resposta.dados.usuario_nome
    );
}


/* ---------- Abertura e fechamento dos modais ---------- */

document.getElementById("btn-entrar").onclick = function() {
    abrirModal(modalLogin, formLogin, loginMsg);
};

document.getElementById("btn-cadastrar").onclick = function() {
    abrirModal(modalCadastro, formCadastro, cadastroMsg);
};

[modalLogin, modalCadastro].forEach(function(modal) {

    // Botão "Cancelar"
    modal.querySelector("[data-fechar]").onclick = function() {
        modal.close();
    };

    // Clique fora da caixa (no fundo escuro) fecha o modal
    modal.addEventListener("click", function(evento) {

        if (evento.target === modal) {
            modal.close();
        }
    });
});


/* ---------- Login ---------- */

formLogin.addEventListener("submit", async function(evento) {

    evento.preventDefault();

    mostrarMensagem(loginMsg, "", "");

    const resposta = await enviarJson("/auth/login", "POST", {
        email: document.getElementById("login-email").value,
        senha: document.getElementById("login-senha").value
    });

    if (!resposta.ok) {

        mostrarMensagem(
            loginMsg,
            resposta.dados.erro || "Não foi possível entrar.",
            "erro"
        );

        return;
    }

    modalLogin.close();

    atualizarAutenticacao(true, resposta.dados.usuario.nome);
});


/* ---------- Cadastro ---------- */

formCadastro.addEventListener("submit", async function(evento) {

    evento.preventDefault();

    mostrarMensagem(cadastroMsg, "", "");

    const email = document.getElementById("cadastro-email").value;
    const senha = document.getElementById("cadastro-senha").value;

    const cadastro = await enviarJson("/usuarios", "POST", {
        nome: document.getElementById("cadastro-nome").value,
        email: email,
        senha: senha
    });

    if (!cadastro.ok) {

        mostrarMensagem(
            cadastroMsg,
            cadastro.dados.erro || "Não foi possível cadastrar.",
            "erro"
        );

        return;
    }

    // Após cadastrar, já realiza o login automaticamente
    const login = await enviarJson("/auth/login", "POST", {
        email: email,
        senha: senha
    });

    modalCadastro.close();

    if (login.ok) {

        atualizarAutenticacao(true, login.dados.usuario.nome);

    } else {

        // Se o login automático falhar, pede para entrar manualmente
        abrirModal(modalLogin, formLogin, loginMsg);

        mostrarMensagem(
            loginMsg,
            "Cadastro realizado! Faça login para continuar.",
            "ok"
        );
    }
});


/* ---------- Botão "Adicionar vídeo" do cabeçalho ---------- */

document.getElementById("btn-novo-video").onclick = function() {

    // Rola suavemente até o formulário de novo vídeo
    secaoNovoVideo.scrollIntoView({ behavior: "smooth", block: "start" });

    // Coloca o cursor no primeiro campo, sem interromper a rolagem
    document.getElementById("video-titulo").focus({ preventScroll: true });
};


/* ---------- Logout ---------- */

document.getElementById("btn-sair").onclick = async function() {

    await enviarJson("/auth/logout", "POST");

    atualizarAutenticacao(false);

    mostrarMensagem(videoMsg, "", "");
};


/* ---------- Lista de lançamentos ---------- */

async function carregarLancamentos() {

    const resposta = await enviarJson("/lancamentos", "GET");

    listaLancamentos.innerHTML = "";

    if (!resposta.ok || !Array.isArray(resposta.dados)) {

        const item = document.createElement("li");
        item.textContent = "Não foi possível carregar os lançamentos.";
        listaLancamentos.appendChild(item);

        return;
    }

    if (resposta.dados.length === 0) {

        const item = document.createElement("li");
        item.textContent = "Nenhum lançamento cadastrado.";
        listaLancamentos.appendChild(item);

        return;
    }

    resposta.dados.forEach(function(lancamento) {

        // Item da lista de lançamentos
        const item = document.createElement("li");

        const nome = document.createElement("strong");
        nome.textContent = lancamento.nome;

        const empresa = document.createElement("small");
        empresa.textContent = lancamento.empresa;

        item.appendChild(nome);
        item.appendChild(empresa);

        listaLancamentos.appendChild(item);

        // Opção correspondente no formulário de novo vídeo
        const opcao = document.createElement("option");
        opcao.value = lancamento.id;
        opcao.textContent = `${lancamento.nome} · ${lancamento.empresa}`;

        selectLancamento.appendChild(opcao);
    });
}


/* ---------- Novo vídeo ---------- */

// Ao colar a URL do YouTube, preenche o ID e a thumbnail automaticamente
document.getElementById("video-url").addEventListener("input", function() {

    const encontrado = this.value.match(
        /(?:youtu\.be\/|[?&]v=|embed\/|shorts\/)([\w-]{11})/
    );

    if (!encontrado) {
        return;
    }

    const id = encontrado[1];
    const thumbnail = document.getElementById("video-thumbnail");

    document.getElementById("video-youtube-id").value = id;

    if (!thumbnail.value) {
        thumbnail.value = `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
    }
});


formVideo.addEventListener("submit", async function(evento) {

    evento.preventDefault();

    mostrarMensagem(videoMsg, "", "");

    const resposta = await enviarJson("/videos", "POST", {
        titulo: document.getElementById("video-titulo").value,
        youtube_id: document.getElementById("video-youtube-id").value,
        url: document.getElementById("video-url").value,
        thumbnail: document.getElementById("video-thumbnail").value,
        duracao: document.getElementById("video-duracao").value,
        lancamento_id: Number(selectLancamento.value)
    });

    // Sessão expirada: volta para o estado deslogado e pede novo login
    if (resposta.status === 401) {

        atualizarAutenticacao(false);
        abrirModal(modalLogin, formLogin, loginMsg);

        mostrarMensagem(
            loginMsg,
            "Sua sessão expirou. Entre novamente.",
            "erro"
        );

        return;
    }

    if (!resposta.ok) {

        mostrarMensagem(
            videoMsg,
            resposta.dados.erro || "Não foi possível adicionar o vídeo.",
            "erro"
        );

        videoMsg.scrollIntoView({ behavior: "smooth", block: "nearest" });

        return;
    }

    formVideo.reset();

    mostrarMensagem(videoMsg, "Vídeo adicionado com sucesso!", "ok");

    // Atualiza a lista de vídeos após o cadastro
    paginaAtual = 1;
    buscaAtual = "";
    tipo.value = "videos";
    termo.value = "";

    buscarVideos();

    videoMsg.scrollIntoView({ behavior: "smooth", block: "nearest" });
});


/* ---------- Inicialização ---------- */

verificarSessao();
carregarLancamentos();
