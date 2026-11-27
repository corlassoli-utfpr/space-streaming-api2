// Elementos HTML utilizados na busca
const form = document.getElementById("form-busca");
const tipo = document.getElementById("tipo-busca");
const termo = document.getElementById("termo");
const lista = document.getElementById("lista-resultados");

// Guarda o termo pesquisado, a página atual e o total de vídeos encontrados
let buscaAtual = "";
let paginaAtual = 1;
let totalVideos = 0;


/* ---------- Busca ---------- */

// Identifica o tipo de pesquisa selecionado pelo usuário
form.addEventListener("submit", function(evento) {

    // Impede que o formulário recarregue a página
    evento.preventDefault();

    if (tipo.value === "videos") {

        // Salva a busca e volta para a primeira página
        buscaAtual = termo.value;
        paginaAtual = 1;
        buscarVideos();

    } else if (tipo.value === "empresas") {

        buscarEmpresas();

    } else {

        // Pesquisa uma empresa utilizando seu ID
        mostrarEmpresa(termo.value);
    }
});


/* ---------- Busca de vídeos ---------- */

async function buscarVideos() {

    // Envia o termo e o número da página para a rota de vídeos
    const resposta = await fetch(
        `/videos?busca=${encodeURIComponent(buscaAtual)}&pagina=${paginaAtual}`
    );

    // A API retorna os vídeos e a quantidade total de resultados
    const dados = await resposta.json();
    const videos = dados.videos;

    totalVideos = dados.total;

    // Remove os resultados da busca anterior
    lista.innerHTML = "";

    // Exibe uma mensagem caso nenhum vídeo seja encontrado
    if (videos.length === 0) {
        lista.innerHTML =
            "<li><button disabled>Nenhum vídeo encontrado.</button></li>";
        return;
    }

    // Cria um item na lista para cada vídeo recebido da API
    videos.forEach(function(video) {

        const item = document.createElement("li");

        // Exibe o título, a duração e a empresa do vídeo
        item.innerHTML = `
            <button type="button">
                <strong>${video.titulo}</strong>
                <small>${video.duracao} · ${video.empresa}</small>
            </button>
        `;

        // Ao clicar, abre o vídeo selecionado no player
        item.querySelector("button").onclick = function() {
            mostrarVideo(video);
        };

        lista.appendChild(item);
    });

    // Cria os controles de navegação entre as páginas
    adicionarPaginacao();
}


/* ---------- Paginação ---------- */

function adicionarPaginacao() {

    // Define quantos vídeos serão exibidos em cada página
    const videosPorPagina = 5;

    // Calcula o total de páginas com base na quantidade de resultados
    const ultimaPagina = Math.ceil(totalVideos / videosPorPagina);
    const item = document.createElement("li");

    item.className = "paginacao";

    // Cria os botões e informa a página atual
    // O botão correspondente fica desabilitado quando não pode ser utilizado
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

    // Diminui o número da página e realiza uma nova busca
    document.getElementById("anterior").onclick = function() {
        paginaAtual--;
        buscarVideos();
    };

    // Aumenta o número da página e realiza uma nova busca
    document.getElementById("proxima").onclick = function() {
        paginaAtual++;
        buscarVideos();
    };
}


/* ---------- Seleção de vídeo ---------- */

async function mostrarVideo(video) {

    // Carrega o vídeo selecionado no player do YouTube
    document.getElementById("player-youtube").src =
        `https://www.youtube-nocookie.com/embed/${video.youtube_id}`;

    // Atualiza o título e as informações do vídeo
    document.getElementById("titulo-video").textContent = video.titulo;

    document.getElementById("info-video").textContent =
        `Lançamento: ${video.lancamento} · Empresa: ${video.empresa}`;

    // Busca os detalhes da empresa relacionada ao vídeo
    const resposta = await fetch(`/empresas/${video.empresa_id}`);
    const empresa = await resposta.json();

    mostrarEmpresaDetalhes(empresa);

    // Procura o lançamento relacionado ao vídeo dentro da lista da empresa
    const lancamento = empresa.lancamentos.find(function(item) {
        return item.id === video.lancamento_id;
    });

    // Exibe os detalhes do lançamento caso ele seja encontrado
    if (lancamento) {
        mostrarLancamento(lancamento);
    }
}


/* ---------- Busca de empresas ---------- */

async function buscarEmpresas() {

    // Busca empresas pelo nome informado
    const resposta = await fetch(
        `/empresas?busca=${encodeURIComponent(termo.value)}`
    );

    const empresas = await resposta.json();

    // Limpa os resultados anteriores
    lista.innerHTML = "";

    if (empresas.length === 0) {
        lista.innerHTML =
            "<li><button disabled>Nenhuma empresa encontrada.</button></li>";
        return;
    }

    // Cria um item para cada empresa encontrada
    empresas.forEach(function(empresa) {

        const item = document.createElement("li");

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

    // Solicita os dados de uma empresa específica
    const resposta = await fetch(`/empresas/${encodeURIComponent(id)}`);

    // Verifica se a API encontrou a empresa
    if (!resposta.ok) {
        lista.innerHTML =
            "<li><button disabled>Empresa não encontrada.</button></li>";
        return;
    }

    const empresa = await resposta.json();

    // Atualiza os detalhes da empresa
    mostrarEmpresaDetalhes(empresa);

    // Remove o vídeo anterior do player e exibe o nome da empresa
    document.getElementById("player-youtube").src = "";
    document.getElementById("titulo-video").textContent = empresa.nome;

    document.getElementById("info-video").textContent =
        `${empresa.lancamentos.length} lançamento(s)`;

    lista.innerHTML = "";

    // Exibe os lançamentos associados à empresa
    empresa.lancamentos.forEach(function(lancamento) {

        const item = document.createElement("li");

        item.innerHTML = `
            <button type="button">
                <strong>${lancamento.nome}</strong>
                <small>${lancamento.status} · ${lancamento.foguete}</small>
            </button>
        `;

        // Permite selecionar um lançamento para visualizar seus detalhes
        item.querySelector("button").onclick = function() {
            mostrarLancamento(lancamento);
        };

        lista.appendChild(item);
    });
}


/* ---------- Exibição dos detalhes ---------- */

// Preenche os campos de informações da empresa
function mostrarEmpresaDetalhes(empresa) {
    document.getElementById("empresa-nome").textContent = empresa.nome;
    document.getElementById("empresa-descricao").textContent = empresa.descricao;
}


// Preenche os campos de informações do lançamento
function mostrarLancamento(lancamento) {
    document.getElementById("lancamento-nome").textContent = lancamento.nome;
    document.getElementById("lancamento-data").textContent = lancamento.data;
    document.getElementById("lancamento-foguete").textContent = lancamento.foguete;
    document.getElementById("lancamento-missao").textContent = lancamento.missao;
    document.getElementById("lancamento-local").textContent = lancamento.local;
    document.getElementById("lancamento-status").textContent = lancamento.status;
    document.getElementById("lancamento-descricao").textContent = lancamento.descricao;
}


/* ---------- Autenticação e cadastro ---------- */

// Elementos responsáveis pela exibição do estado de autenticação
const areaDeslogado = document.getElementById("auth-deslogado");
const areaLogado = document.getElementById("auth-logado");
const usuarioNome = document.getElementById("usuario-nome");

// Formulários, modais e seção de cadastro de vídeos
const modalLogin = document.getElementById("modal-login");
const modalCadastro = document.getElementById("modal-cadastro");
const formLogin = document.getElementById("form-login");
const formCadastro = document.getElementById("form-cadastro");
const formVideo = document.getElementById("form-video");
const secaoNovoVideo = document.getElementById("secao-novo-video");

// Elementos utilizados para exibir mensagens
const loginMsg = document.getElementById("login-msg");
const cadastroMsg = document.getElementById("cadastro-msg");
const videoMsg = document.getElementById("video-msg");

// Lista de lançamentos e campo de seleção do formulário de vídeo
const listaLancamentos = document.getElementById("lista-lancamentos");
const selectLancamento = document.getElementById("video-lancamento");


/* ---------- Funções auxiliares ---------- */

// Centraliza o envio de requisições com JSON para a API
async function enviarJson(url, metodo, corpo) {

    try {

        // Configura o método HTTP, os cabeçalhos e o corpo da requisição
        const resposta = await fetch(url, {
            method: metodo,
            headers: { "Content-Type": "application/json" },
            body: corpo ? JSON.stringify(corpo) : undefined
        });

        // Tenta converter a resposta para JSON
        // Caso não exista um JSON válido, utiliza um objeto vazio
        const dados = await resposta.json().catch(function() {
            return {};
        });

        // Retorna o resultado da requisição em um formato padronizado
        return {
            ok: resposta.ok,
            status: resposta.status,
            dados: dados
        };

    } catch (erro) {

        // Trata falhas de conexão com o servidor
        return {
            ok: false,
            status: 0,
            dados: { erro: "Falha de conexão com o servidor." }
        };
    }
}


// Exibe uma mensagem e aplica a classe correspondente ao seu tipo
function mostrarMensagem(elemento, texto, tipo) {
    elemento.textContent = texto;
    elemento.className = "mensagem" + (texto ? " " + tipo : "");
}


// Limpa os campos e as mensagens antes de abrir um modal
function abrirModal(modal, formulario, mensagem) {
    formulario.reset();
    mostrarMensagem(mensagem, "", "");
    modal.showModal();
}


/* ---------- Estado de autenticação ---------- */

function atualizarAutenticacao(autenticado, nome) {

    // Exibe os elementos correspondentes ao estado atual do usuário
    areaDeslogado.hidden = autenticado;
    areaLogado.hidden = !autenticado;

    // O formulário de cadastro de vídeos só aparece para usuários logados
    secaoNovoVideo.hidden = !autenticado;

    usuarioNome.textContent = autenticado ? `Olá, ${nome}` : "";
}


// Verifica se já existe uma sessão autenticada no servidor
async function verificarSessao() {
    const resposta = await enviarJson("/auth/me", "GET");

    atualizarAutenticacao(
        resposta.dados.autenticado === true,
        resposta.dados.usuario_nome
    );
}


/* ---------- Abertura e fechamento dos modais ---------- */

// Abre o formulário de login
document.getElementById("btn-entrar").onclick = function() {
    abrirModal(modalLogin, formLogin, loginMsg);
};

// Abre o formulário de cadastro de usuário
document.getElementById("btn-cadastrar").onclick = function() {
    abrirModal(modalCadastro, formCadastro, cadastroMsg);
};

// Configura o fechamento dos dois modais
[modalLogin, modalCadastro].forEach(function(modal) {

    // Fecha o modal pelo botão de cancelar
    modal.querySelector("[data-fechar]").onclick = function() {
        modal.close();
    };

    // Também fecha o modal quando o usuário clica fora de sua caixa
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

    // Envia as credenciais para a rota de autenticação
    const resposta = await enviarJson("/auth/login", "POST", {
        email: document.getElementById("login-email").value,
        senha: document.getElementById("login-senha").value
    });

    // Exibe o erro retornado pela API caso o login falhe
    if (!resposta.ok) {
        mostrarMensagem(
            loginMsg,
            resposta.dados.erro || "Não foi possível entrar.",
            "erro"
        );
        return;
    }

    // Fecha o modal e atualiza a interface para usuário autenticado
    modalLogin.close();
    atualizarAutenticacao(true, resposta.dados.usuario.nome);
});


/* ---------- Cadastro ---------- */

formCadastro.addEventListener("submit", async function(evento) {
    evento.preventDefault();
    mostrarMensagem(cadastroMsg, "", "");

    const email = document.getElementById("cadastro-email").value;
    const senha = document.getElementById("cadastro-senha").value;

    // Envia os dados para criar um novo usuário
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

    // Após cadastrar, tenta autenticar o usuário automaticamente
    const login = await enviarJson("/auth/login", "POST", {
        email: email,
        senha: senha
    });

    modalCadastro.close();

    if (login.ok) {

        // Atualiza a interface após o login automático
        atualizarAutenticacao(true, login.dados.usuario.nome);

    } else {

        // Caso o login automático falhe, solicita login manual
        abrirModal(modalLogin, formLogin, loginMsg);

        mostrarMensagem(
            loginMsg,
            "Cadastro realizado! Faça login para continuar.",
            "ok"
        );
    }
});


/* ---------- Adicionar vídeo ---------- */

// Leva o usuário até o formulário de cadastro de vídeos
document.getElementById("btn-novo-video").onclick = function() {
    secaoNovoVideo.scrollIntoView({ behavior: "smooth", block: "start" });

    // Coloca o cursor no campo de título sem interromper a rolagem
    document.getElementById("video-titulo").focus({
        preventScroll: true
    });
};


/* ---------- Logout ---------- */

// Encerra a sessão no servidor e atualiza a interface
document.getElementById("btn-sair").onclick = async function() {
    await enviarJson("/auth/logout", "POST");

    atualizarAutenticacao(false);
    mostrarMensagem(videoMsg, "", "");
};


/* ---------- Lista de lançamentos ---------- */

async function carregarLancamentos() {

    // Busca todos os lançamentos disponíveis na API
    const resposta = await enviarJson("/lancamentos", "GET");

    listaLancamentos.innerHTML = "";

    // Verifica se a requisição falhou ou retornou dados inválidos
    if (!resposta.ok || !Array.isArray(resposta.dados)) {
        listaLancamentos.innerHTML =
            "<li>Não foi possível carregar os lançamentos.</li>";
        return;
    }

    if (resposta.dados.length === 0) {
        listaLancamentos.innerHTML =
            "<li>Nenhum lançamento cadastrado.</li>";
        return;
    }

    // Percorre os lançamentos recebidos e adiciona cada um à lista
    resposta.dados.forEach(function(lancamento) {
        const item = document.createElement("li");
        const nome = document.createElement("strong");
        const empresa = document.createElement("small");

        nome.textContent = lancamento.nome;
        empresa.textContent = lancamento.empresa;

        item.appendChild(nome);
        item.appendChild(empresa);
        listaLancamentos.appendChild(item);

        // Adiciona o lançamento também ao campo de seleção do formulário
        const opcao = document.createElement("option");
        opcao.value = lancamento.id;
        opcao.textContent = `${lancamento.nome} · ${lancamento.empresa}`;

        selectLancamento.appendChild(opcao);
    });
}


/* ---------- Preenchimento automático do YouTube ---------- */

// Extrai o ID do vídeo e preenche a thumbnail ao informar uma URL
document.getElementById("video-url").addEventListener("input", function() {

    // Identifica o ID em formatos comuns de links do YouTube
    const encontrado = this.value.match(
        /(?:youtu\.be\/|[?&]v=|embed\/|shorts\/)([\w-]{11})/
    );

    if (!encontrado) return;

    const id = encontrado[1];
    const thumbnail = document.getElementById("video-thumbnail");

    // Preenche o campo com o ID encontrado
    document.getElementById("video-youtube-id").value = id;

    // Gera a URL da thumbnail somente se o campo estiver vazio
    if (!thumbnail.value) {
        thumbnail.value = `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
    }
});


/* ---------- Cadastro de novo vídeo ---------- */

formVideo.addEventListener("submit", async function(evento) {
    evento.preventDefault();
    mostrarMensagem(videoMsg, "", "");

    // Envia os dados do formulário para cadastrar um vídeo
    const resposta = await enviarJson("/videos", "POST", {
        titulo: document.getElementById("video-titulo").value,
        youtube_id: document.getElementById("video-youtube-id").value,
        url: document.getElementById("video-url").value,
        thumbnail: document.getElementById("video-thumbnail").value,
        duracao: document.getElementById("video-duracao").value,
        lancamento_id: Number(selectLancamento.value)
    });

    // Verifica se a sessão expirou e solicita novo login
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

    // Exibe o erro retornado pela API caso o cadastro falhe
    if (!resposta.ok) {
        mostrarMensagem(
            videoMsg,
            resposta.dados.erro || "Não foi possível adicionar o vídeo.",
            "erro"
        );

        videoMsg.scrollIntoView({ behavior: "smooth", block: "nearest" });
        return;
    }

    // Limpa o formulário e informa que o cadastro foi concluído
    formVideo.reset();
    mostrarMensagem(videoMsg, "Vídeo adicionado com sucesso!", "ok");

    // Volta para a primeira página e remove filtros anteriores
    paginaAtual = 1;
    buscaAtual = "";
    tipo.value = "videos";
    termo.value = "";

    // Atualiza a lista para incluir o vídeo recém-cadastrado
    buscarVideos();

    videoMsg.scrollIntoView({ behavior: "smooth", block: "nearest" });
});


/* ---------- Inicialização ---------- */

// Verifica a autenticação e carrega os lançamentos ao abrir a página
verificarSessao();
carregarLancamentos();
