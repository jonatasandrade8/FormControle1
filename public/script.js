// script.js
// Importe as funções necessárias do SDK do Firebase
import { initializeApp } from "firebase/app";
import { 
    getFirestore, 
    collection, 
    addDoc, 
    getDocs, 
    query, 
    where, 
    orderBy, 
    serverTimestamp,
    doc,
    deleteDoc,
    setDoc,
    updateDoc,
    onSnapshot // Para escutar mudanças em tempo real (opcional, mas útil para listas)
} from "firebase/firestore";

// Suas credenciais do Firebase
const firebaseConfig = {
    apiKey: "AIzaSyCaGscKmGV2Z6T-Pd6awZKQl3iWOhDeOTE",
    authDomain: "formdata-95f6e.firebaseapp.com",
    projectId: "formdata-95f6e",
    storageBucket: "formdata-95f6e.firebasestorage.app",
    messagingSenderId: "373934858331",
    appId: "1:373934858331:web:90c3260a2ef71e8e511f7e",
    measurementId: "G-NXFBKJTPGE"
};

// Inicialize o Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app); // Obtenha a instância do Firestore

// --- Variáveis globais para dados mestres (carregadas do Firestore) ---
let allStates = [];
let allUsers = [];
let allNetworks = [];
let allStores = [];
let allEmails = [];
let currentSchedule = {
    inventory: { days: [], time: '13:00' },
    dryBoxes: { days: [], time: '13:00' }
};

// --- Funções de Utilitário ---

/**
 * Exibe uma mensagem de status ou erro.
 * @param {string} message A mensagem a ser exibida.
 * @param {boolean} isError Se a mensagem é de erro (true) ou sucesso (false).
 */
function showStatusMessage(message, isError = false) {
    const statusDiv = document.getElementById('status');
    statusDiv.textContent = message;
    statusDiv.className = isError ? 'status-error' : 'status-success';
    statusDiv.style.display = 'block';
    setTimeout(() => {
        statusDiv.style.display = 'none';
    }, 5000); // Esconde a mensagem após 5 segundos
}

/**
 * Carrega os dados mestres (estados, usuários, redes, lojas, emails) do Firestore.
 * Deve ser chamado no início e sempre que dados de configuração forem alterados.
 */
async function loadMasterData() {
    try {
        // Carregar estados
        const statesSnapshot = await getDocs(collection(db, "states"));
        allStates = statesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        // Carregar usuários
        const usersSnapshot = await getDocs(collection(db, "users"));
        allUsers = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Carregar redes
        const networksSnapshot = await getDocs(collection(db, "networks"));
        allNetworks = networksSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Carregar lojas
        const storesSnapshot = await getDocs(collection(db, "stores"));
        allStores = storesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Carregar emails (do documento de configurações)
        const configDocRef = doc(db, "configs", "appConfig");
        const configDoc = await getDocs(configDocRef);
        if (configDoc.exists()) {
            allEmails = configDoc.data().emails || [];
            currentSchedule = configDoc.data().schedule || currentSchedule;
            applyScheduleSettingsToUI(); // Aplica os horários carregados à UI
        } else {
            // Se o documento de config não existir, crie um com valores padrão
            await setDoc(configDocRef, { emails: [], schedule: currentSchedule });
        }


        console.log("Dados mestres carregados:", { allStates, allUsers, allNetworks, allStores, allEmails, currentSchedule });
        showStatusMessage("Dados mestres carregados com sucesso.");
    } catch (error) {
        console.error("Erro ao carregar dados mestres:", error);
        showStatusMessage("Erro ao carregar dados mestres.", true);
    }
}

/**
 * Popula um elemento <select> com opções.
 * @param {string} selectId ID do elemento select.
 * @param {Array<Object>} data Array de objetos com { id, name }.
 * @param {string} placeholder Texto da opção padrão.
 */
function populateSelect(selectId, data, placeholder) {
    const selectElement = document.getElementById(selectId);
    if (!selectElement) {
        console.warn(`Elemento select com ID ${selectId} não encontrado.`);
        return;
    }
    selectElement.innerHTML = `<option value="">${placeholder}</option>`;
    data.forEach(item => {
        const option = document.createElement('option');
        option.value = item.name; // Usar o nome como valor para facilitar a exibição
        option.textContent = item.name;
        option.dataset.docId = item.id; // Guardar o ID do documento do Firestore
        selectElement.appendChild(option);
    });
}

// --- Lógica de Abas ---
function showTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.tab-button').forEach(button => {
        button.classList.remove('active');
    });

    document.getElementById(tabId + 'Tab').classList.add('active');
    document.querySelector(`.tab-button[onclick="showTab('${tabId}')"]`).classList.add('active');

    // Chamar função de carregamento quando a aba do gestor é ativada
    if (tabId === 'manager' && document.getElementById('managerArea').style.display === 'block') {
        loadManagerPendingData();
        loadStatesForConfigDropdowns(); // Carrega estados para os selects de config
        loadStatesForDataViewDropdown(); // Carrega estados para o filtro de dados
        loadPendingUsersView(); // Carrega usuários pendentes
    }
}

function showManagerTab(tabId) {
    document.querySelectorAll('.manager-tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.manager-tab-button').forEach(button => {
        button.classList.remove('active');
    });

    const targetTabElement = document.getElementById('manager' + tabId.charAt(0).toUpperCase() + tabId.slice(1) + 'Tab');
    if (targetTabElement) {
        targetTabElement.classList.add('active');
    }
    const targetButtonElement = document.querySelector(`.manager-tab-button[onclick="showManagerTab('${tabId}')"]`);
    if (targetButtonElement) {
        targetButtonElement.classList.add('active');
    }

    // Carregar dados específicos da aba do gestor
    if (tabId === 'pending') {
        loadManagerPendingData();
    } else if (tabId === 'data') {
        loadStatesForDataViewDropdown();
        loadDataView();
    } else if (tabId === 'users') {
        loadPendingUsersView();
    } else if (tabId === 'config') {
        loadStatesForConfigDropdowns();
        applyScheduleSettingsToUI();
        loadUsersInConfig();
        loadStatesInConfig();
        loadNetworksInConfig();
        loadStoresInConfig();
        loadEmailsInConfig();
    }
}

// --- Lógica de Carregamento de Dropdowns (Formulários de Entrada) ---

async function loadStatesForForms() {
    populateSelect('state', allStates, 'Selecione um estado');
    populateSelect('dryState', allStates, 'Selecione um estado');
}

async function loadNetworksAndUsersForInventory() {
    const selectedStateName = document.getElementById('state').value;
    const selectedState = allStates.find(s => s.name === selectedStateName);

    // Carregar usuários para o estado selecionado
    const filteredUsers = selectedState ? allUsers.filter(u => u.stateId === selectedState.id) : [];
    populateSelect('user', filteredUsers, 'Selecione um usuário');

    // Carregar redes para o estado selecionado
    const filteredNetworks = selectedState ? allNetworks.filter(n => n.stateId === selectedState.id) : [];
    populateSelect('network', filteredNetworks, 'Selecione uma rede');

    loadStoresForInventory(); // Limpa/atualiza as lojas
}

async function loadStoresForInventory() {
    const selectedNetworkName = document.getElementById('network').value;
    const selectedNetwork = allNetworks.find(n => n.name === selectedNetworkName);

    const filteredStores = selectedNetwork ? allStores.filter(s => s.networkId === selectedNetwork.id) : [];
    populateSelect('store', filteredStores, 'Selecione uma loja');
}

async function loadNetworksAndUsersForDryBoxes() {
    const selectedStateName = document.getElementById('dryState').value;
    const selectedState = allStates.find(s => s.name === selectedStateName);

    const filteredUsers = selectedState ? allUsers.filter(u => u.stateId === selectedState.id) : [];
    populateSelect('dryUser', filteredUsers, 'Selecione um usuário');

    const filteredNetworks = selectedState ? allNetworks.filter(n => n.stateId === selectedState.id) : [];
    populateSelect('dryNetwork', filteredNetworks, 'Selecione uma rede');

    loadStoresForDryBoxes(); // Limpa/atualiza as lojas
}

async function loadStoresForDryBoxes() {
    const selectedNetworkName = document.getElementById('dryNetwork').value;
    const selectedNetwork = allNetworks.find(n => n.name === selectedNetworkName);

    const filteredStores = selectedNetwork ? allStores.filter(s => s.networkId === selectedNetwork.id) : [];
    populateSelect('dryStore', filteredStores, 'Selecione uma loja');
}

// --- Submissão de Formulários de Entrada ---
async function submitInventoryForm(e) {
    e.preventDefault();

    const stateName = document.getElementById('state').value;
    const user = document.getElementById('user').value;
    const networkName = document.getElementById('network').value;
    const store = document.getElementById('store').value;
    const productType = document.getElementById('productType').value;
    const boxType = document.getElementById('boxType').value;
    const quantity = parseInt(document.getElementById('quantity').value);

    // Obter os IDs dos documentos selecionados
    const stateId = allStates.find(s => s.name === stateName)?.id;
    const networkId = allNetworks.find(n => n.name === networkName)?.id;
    const userId = allUsers.find(u => u.name === user && u.stateId === stateId)?.id; // Assumindo unicidade por estado
    const storeId = allStores.find(s => s.name === store && s.networkId === networkId)?.id; // Assumindo unicidade por rede

    if (!stateId || !userId || !networkId || !storeId) {
        showStatusMessage("Por favor, selecione todos os campos obrigatórios (Estado, Usuário, Rede, Loja).", true);
        return;
    }

    const inventoryData = {
        state: stateName,
        stateId: stateId,
        user: user,
        userId: userId,
        network: networkName,
        networkId: networkId,
        store: store,
        storeId: storeId,
        productType: productType,
        boxType: boxType,
        quantity: quantity,
        timestamp: serverTimestamp()
    };

    try {
        await addDoc(collection(db, "inventory"), inventoryData);
        showStatusMessage("Item de inventário adicionado com sucesso!");
        document.getElementById('stockForm').reset();
        // Recarregar os dropdowns após o reset se necessário ou apenas limpar as seleções
        loadStatesForForms(); // Para re-selecionar o estado inicial
        document.getElementById('network').innerHTML = '<option value="">Selecione uma rede</option>';
        document.getElementById('user').innerHTML = '<option value="">Selecione um usuário</option>';
        document.getElementById('store').innerHTML = '<option value="">Selecione uma loja</option>';
        loadLatestInventoryItems(); // Atualizar a lista de itens adicionados
    } catch (error) {
        console.error("Erro ao adicionar item de inventário:", error);
        showStatusMessage("Erro ao adicionar item de inventário.", true);
    }
}

async function submitDryBoxesForm(e) {
    e.preventDefault();

    const dryStateName = document.getElementById('dryState').value;
    const dryUser = document.getElementById('dryUser').value;
    const dryNetworkName = document.getElementById('dryNetwork').value;
    const dryStore = document.getElementById('dryStore').value;
    const dryBoxType = document.getElementById('dryBoxType').value;
    const dryQuantity = parseInt(document.getElementById('dryQuantity').value);

    // Obter os IDs dos documentos selecionados
    const dryStateId = allStates.find(s => s.name === dryStateName)?.id;
    const dryNetworkId = allNetworks.find(n => n.name === dryNetworkName)?.id;
    const dryUserId = allUsers.find(u => u.name === dryUser && u.stateId === dryStateId)?.id;
    const dryStoreId = allStores.find(s => s.name === dryStore && s.networkId === dryNetworkId)?.id;

    if (!dryStateId || !dryUserId || !dryNetworkId || !dryStoreId) {
        showStatusMessage("Por favor, selecione todos os campos obrigatórios (Estado, Usuário, Rede, Loja).", true);
        return;
    }

    const dryBoxData = {
        state: dryStateName,
        stateId: dryStateId,
        user: dryUser,
        userId: dryUserId,
        network: dryNetworkName,
        networkId: dryNetworkId,
        store: dryStore,
        storeId: dryStoreId,
        boxType: dryBoxType,
        quantity: dryQuantity,
        timestamp: serverTimestamp()
    };

    try {
        await addDoc(collection(db, "dryBoxes"), dryBoxData);
        showStatusMessage("Caixa seca adicionada com sucesso!");
        document.getElementById('dryBoxesForm').reset();
        loadStatesForForms();
        document.getElementById('dryNetwork').innerHTML = '<option value="">Selecione uma rede</option>';
        document.getElementById('dryUser').innerHTML = '<option value="">Selecione um usuário</option>';
        document.getElementById('dryStore').innerHTML = '<option value="">Selecione uma loja</option>';
        loadLatestDryBoxItems(); // Atualizar a lista de itens adicionados
    } catch (error) {
        console.error("Erro ao adicionar caixa seca:", error);
        showStatusMessage("Erro ao adicionar caixa seca.", true);
    }
}

// Função para exibir os últimos itens adicionados ( Inventário )
async function loadLatestInventoryItems() {
    const itemsDiv = document.getElementById('items');
    itemsDiv.innerHTML = 'Carregando itens...';
    try {
        const q = query(collection(db, "inventory"), orderBy("timestamp", "desc"), limit(5)); // Pega os últimos 5
        const querySnapshot = await getDocs(q);
        if (querySnapshot.empty) {
            itemsDiv.innerHTML = '<p>Nenhum item de inventário adicionado ainda.</p>';
            return;
        }
        let html = '<ul>';
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            const date = data.timestamp ? new Date(data.timestamp.toDate()).toLocaleString() : 'N/A';
            html += `<li><strong>${data.productType}</strong> (${data.boxType}): ${data.quantity} caixas - Loja: ${data.store}, Rede: ${data.network}, Usuário: ${data.user} (${date})</li>`;
        });
        html += '</ul>';
        itemsDiv.innerHTML = html;
        document.getElementById('submitInventory').style.display = 'block'; // Mostra o botão se houver itens
    } catch (error) {
        console.error("Erro ao carregar itens de inventário:", error);
        itemsDiv.innerHTML = '<p class="status-error">Erro ao carregar itens.</p>';
    }
}

// Função para exibir os últimos itens adicionados ( Caixas Secas )
async function loadLatestDryBoxItems() {
    const itemsDiv = document.getElementById('dryBoxesItems');
    itemsDiv.innerHTML = 'Carregando itens...';
    try {
        const q = query(collection(db, "dryBoxes"), orderBy("timestamp", "desc"), limit(5)); // Pega os últimos 5
        const querySnapshot = await getDocs(q);
        if (querySnapshot.empty) {
            itemsDiv.innerHTML = '<p>Nenhuma caixa seca adicionada ainda.</p>';
            return;
        }
        let html = '<ul>';
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            const date = data.timestamp ? new Date(data.timestamp.toDate()).toLocaleString() : 'N/A';
            html += `<li><strong>${data.boxType}</strong>: ${data.quantity} caixas - Loja: ${data.store}, Rede: ${data.network}, Usuário: ${data.user} (${date})</li>`;
        });
        html += '</ul>';
        itemsDiv.innerHTML = html;
        document.getElementById('submitDryBoxes').style.display = 'block'; // Mostra o botão se houver itens
    } catch (error) {
        console.error("Erro ao carregar caixas secas:", error);
        itemsDiv.innerHTML = '<p class="status-error">Erro ao carregar caixas secas.</p>';
    }
}


// Placeholder para a função submitToQueue (você implementará a lógica de envio de email ou notificação aqui)
function submitToQueue(type) {
    alert(`Funcionalidade de adicionar à fila de envio de ${type} será implementada (ex: enviar email com os dados).`);
    console.log(`Dados prontos para serem enviados para ${type} (via Cloud Function/Email Service).`);
    showStatusMessage(`Dados de ${type} adicionados à fila de envio.`, false);
}
window.submitToQueue = submitToQueue; // Expor para o HTML

// --- Funções de Countdown ---
function startCountdown(elementId, targetHour, targetMinute, targetDayOfWeek = null) {
    const countdownElement = document.getElementById(elementId);
    if (!countdownElement) return;

    function updateCountdown() {
        const now = new Date();
        let targetDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), targetHour, targetMinute, 0, 0);

        if (targetDayOfWeek !== null) { // Se for para um dia da semana específico
            let daysUntilTarget = targetDayOfWeek - now.getDay();
            if (daysUntilTarget < 0 || (daysUntilTarget === 0 && now.getTime() > targetDate.getTime())) {
                daysUntilTarget += 7; // Próxima semana
            }
            targetDate.setDate(now.getDate() + daysUntilTarget);
            targetDate.setHours(targetHour, targetMinute, 0, 0);
        }

        // Se o tempo alvo já passou hoje (e não é um dia da semana específico ou já ajustamos para o próximo)
        if (now.getTime() > targetDate.getTime() && targetDayOfWeek === null) {
            targetDate.setDate(targetDate.getDate() + 1);
        }

        const timeLeft = targetDate.getTime() - now.getTime();

        if (timeLeft < 0) {
            countdownElement.textContent = "Tempo esgotado!";
            clearInterval(interval);
            return;
        }

        const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
        const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

        let countdownText = '';
        if (days > 0) {
            countdownText += `${days}d `;
        }
        countdownText += `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        countdownElement.textContent = countdownText;
    }

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
}

// --- Lógica da Área de Gestores ---

// Login do gestor (simples, para demonstração)
const CORRECT_MANAGER_PASSWORD = "admin"; // MUDE ISSO EM PRODUÇÃO! Use Firebase Authentication.

document.addEventListener('DOMContentLoaded', () => {
    const managerLoginForm = document.getElementById('managerLoginForm');
    const managerPasswordInput = document.getElementById('managerPassword');
    const loginErrorDiv = document.getElementById('loginError');
    const managerLoginDiv = document.getElementById('managerLogin');
    const managerAreaDiv = document.getElementById('managerArea');
    const logoutManagerBtn = document.getElementById('logoutManager');

    if (managerLoginForm) {
        managerLoginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            if (managerPasswordInput.value === CORRECT_MANAGER_PASSWORD) {
                managerLoginDiv.style.display = 'none';
                managerAreaDiv.style.display = 'block';
                loginErrorDiv.style.display = 'none';
                showManagerTab('pending'); // Carrega a aba de pendências por padrão
            } else {
                loginErrorDiv.style.display = 'block';
            }
        });
    }

    if (logoutManagerBtn) {
        logoutManagerBtn.addEventListener('click', () => {
            managerAreaDiv.style.display = 'none';
            managerLoginDiv.style.display = 'block';
            managerPasswordInput.value = '';
            loginErrorDiv.style.display = 'none';
        });
    }
});

// Funções para carregar dados na área do gestor

async function loadManagerPendingData() {
    const managerInventoryData = document.getElementById('managerInventoryData');
    const managerDryBoxesData = document.getElementById('managerDryBoxesData');

    managerInventoryData.innerHTML = 'Carregando dados de inventário pendentes...';
    managerDryBoxesData.innerHTML = 'Carregando dados de caixas secas pendentes...';

    try {
        // Exemplo: pegar os últimos 10 envios de inventário
        const inventoryQuery = query(collection(db, "inventory"), orderBy("timestamp", "desc"), limit(10));
        const inventorySnapshot = await getDocs(inventoryQuery);
        displayPendingData(inventorySnapshot, managerInventoryData, 'inventory');

        // Exemplo: pegar os últimos 10 envios de caixas secas
        const dryBoxesQuery = query(collection(db, "dryBoxes"), orderBy("timestamp", "desc"), limit(10));
        const dryBoxesSnapshot = await getDocs(dryBoxesQuery);
        displayPendingData(dryBoxesSnapshot, managerDryBoxesData, 'dryBoxes');

    } catch (error) {
        console.error("Erro ao carregar dados pendentes do gestor:", error);
        managerInventoryData.innerHTML = '<p class="status-error">Erro ao carregar dados de inventário.</p>';
        managerDryBoxesData.innerHTML = '<p class="status-error">Erro ao carregar dados de caixas secas.</p>';
    }
}

function displayPendingData(snapshot, containerElement, type) {
    if (snapshot.empty) {
        containerElement.innerHTML = `<p>Nenhum envio de ${type} recente.</p>`;
        return;
    }
    let html = '<ul class="data-list">';
    snapshot.forEach(doc => {
        const data = doc.data();
        const timestamp = data.timestamp ? new Date(data.timestamp.toDate()).toLocaleString() : 'N/A';
        if (type === 'inventory') {
            html += `<li><strong>${data.productType} (${data.boxType})</strong>: ${data.quantity} caixas - Loja: ${data.store}, Usuário: ${data.user} (${timestamp})</li>`;
        } else if (type === 'dryBoxes') {
            html += `<li><strong>${data.boxType}</strong>: ${data.quantity} caixas - Loja: ${data.store}, Usuário: ${data.user} (${timestamp})</li>`;
        }
    });
    html += '</ul>';
    containerElement.innerHTML = html;
}


// --- Funções de Carregamento de Dropdowns (Configurações e Dados) ---

// Popula os dropdowns de estado na aba de configurações e dados
async function loadStatesForConfigDropdowns() {
    // Para "Novo Usuário"
    populateSelect('newUserState', allStates, 'Selecione um estado');
    // Para "Filtrar por Estado" (usuários)
    populateSelect('userStateFilter', [{id: '', name: 'Todos os estados'}].concat(allStates), 'Todos os estados');
    // Para "Filtrar por Estado" (redes)
    populateSelect('networkStateFilter', [{id: '', name: 'Selecione um estado'}].concat(allStates), 'Selecione um estado');
    // Para "Tipo de Dados"
    populateSelect('dataState', [{id: '', name: 'Todos os estados'}].concat(allStates), 'Todos os estados');
}

async function loadStatesForDataViewDropdown() {
    populateSelect('dataState', [{id: '', name: 'Todos os estados'}].concat(allStates), 'Todos os estados');
}

async function loadNetworksForDataView() {
    const selectedStateName = document.getElementById('dataState').value;
    const selectedState = allStates.find(s => s.name === selectedStateName);
    
    let filteredNetworks = [];
    if (selectedState) {
        filteredNetworks = allNetworks.filter(n => n.stateId === selectedState.id);
    }
    populateSelect('dataNetwork', [{id: '', name: 'Todas as redes'}].concat(filteredNetworks), 'Todas as redes');
    loadDataView();
}


// --- Funções de Configurações (CRUD no Firestore) ---

// Horários de Envio
async function saveScheduleSettings() {
    const inventoryDays = Array.from(document.querySelectorAll('#managerConfigTab #inventoryDay0, #inventoryDay1, #inventoryDay2, #inventoryDay3, #inventoryDay4, #inventoryDay5, #inventoryDay6:checked'))
                               .map(cb => parseInt(cb.value));
    const inventoryTime = document.getElementById('inventoryTime').value;

    const dryBoxesDays = Array.from(document.querySelectorAll('#managerConfigTab #dryBoxesDay0, #dryBoxesDay1, #dryBoxesDay2, #dryBoxesDay3, #dryBoxesDay4, #dryBoxesDay5, #dryBoxesDay6:checked'))
                               .map(cb => parseInt(cb.value));
    const dryBoxesTime = document.getElementById('dryBoxesTime').value;

    currentSchedule = {
        inventory: { days: inventoryDays, time: inventoryTime },
        dryBoxes: { days: dryBoxesDays, time: dryBoxesTime }
    };

    try {
        const configDocRef = doc(db, "configs", "appConfig");
        await setDoc(configDocRef, { schedule: currentSchedule }, { merge: true });
        showStatusMessage("Horários de envio salvos com sucesso!");
        // Reinicia os contadores com os novos horários
        const [invHour, invMin] = inventoryTime.split(':').map(Number);
        startCountdown('inventoryCountdown', invHour, invMin);
        
        // Para caixas secas, se for para a próxima segunda-feira (dia 1)
        const [dryHour, dryMin] = dryBoxesTime.split(':').map(Number);
        if (dryBoxesDays.includes(1)) { // Assumindo que você quer "próxima segunda" se segunda estiver selecionada
             startCountdown('dryBoxesCountdown', dryHour, dryMin, 1); 
        } else {
             startCountdown('dryBoxesCountdown', dryHour, dryMin); // Comportamento padrão
        }

    } catch (error) {
        console.error("Erro ao salvar horários:", error);
        showStatusMessage("Erro ao salvar horários.", true);
    }
}
window.saveScheduleSettings = saveScheduleSettings;

function applyScheduleSettingsToUI() {
    if (currentSchedule.inventory) {
        currentSchedule.inventory.days.forEach(day => {
            const cb = document.getElementById(`inventoryDay${day}`);
            if (cb) cb.checked = true;
        });
        document.getElementById('inventoryTime').value = currentSchedule.inventory.time;
    }
    if (currentSchedule.dryBoxes) {
        currentSchedule.dryBoxes.days.forEach(day => {
            const cb = document.getElementById(`dryBoxesDay${day}`);
            if (cb) cb.checked = true;
        });
        document.getElementById('dryBoxesTime').value = currentSchedule.dryBoxes.time;
    }
}


// Gerenciar Usuários
async function addUser() {
    const newUserInput = document.getElementById('newUser');
    const newUserStateSelect = document.getElementById('newUserState');
    const userName = newUserInput.value.trim();
    const stateName = newUserStateSelect.value;
    const state = allStates.find(s => s.name === stateName);

    if (userName && state) {
        try {
            await addDoc(collection(db, "users"), { name: userName, stateId: state.id });
            newUserInput.value = '';
            showStatusMessage(`Usuário "${userName}" adicionado ao estado "${stateName}".`);
            await loadMasterData(); // Recarregar dados mestres para atualizar todas as listas
            loadUsersInConfig(); // Recarregar a lista de usuários na config
            loadNetworksAndUsersForInventory(); // Atualizar dropdowns nos formulários
            loadNetworksAndUsersForDryBoxes();
        } catch (error) {
            console.error("Erro ao adicionar usuário:", error);
            showStatusMessage("Erro ao adicionar usuário.", true);
        }
    } else {
        showStatusMessage("Por favor, insira um nome de usuário e selecione um estado.", true);
    }
}
window.addUser = addUser;

async function loadUsersInConfig() {
    const usersListDiv = document.getElementById('usersList');
    usersListDiv.innerHTML = 'Carregando usuários...';
    const filterStateName = document.getElementById('userStateFilter').value;
    const searchTerm = document.getElementById('searchUser').value.toLowerCase();

    let filteredUsers = allUsers;
    if (filterStateName) {
        const state = allStates.find(s => s.name === filterStateName);
        if (state) {
            filteredUsers = filteredUsers.filter(u => u.stateId === state.id);
        }
    }
    if (searchTerm) {
        filteredUsers = filteredUsers.filter(u => u.name.toLowerCase().includes(searchTerm));
    }

    if (filteredUsers.length === 0) {
        usersListDiv.innerHTML = '<p>Nenhum usuário encontrado.</p>';
        return;
    }

    let html = '<ul class="config-list">';
    filteredUsers.forEach(user => {
        const userState = allStates.find(s => s.id === user.stateId)?.name || 'Desconhecido';
        html += `<li>
                    <input type="checkbox" data-id="${user.id}">
                    <span>${user.name} (${userState})</span>
                 </li>`;
    });
    html += '</ul>';
    usersListDiv.innerHTML = html;
}
window.loadUsersInConfig = loadUsersInConfig;

function selectAllUsers() {
    document.querySelectorAll('#usersList input[type="checkbox"]').forEach(cb => cb.checked = true);
}
window.selectAllUsers = selectAllUsers;

function deselectAllUsers() {
    document.querySelectorAll('#usersList input[type="checkbox"]').forEach(cb => cb.checked = false);
}
window.deselectAllUsers = deselectAllUsers;

async function removeSelectedUsers() {
    const selectedUserIds = Array.from(document.querySelectorAll('#usersList input[type="checkbox"]:checked'))
                               .map(cb => cb.dataset.id);
    if (selectedUserIds.length === 0) {
        showStatusMessage("Selecione os usuários para remover.", true);
        return;
    }

    if (!confirm(`Tem certeza que deseja remover ${selectedUserIds.length} usuário(s)?`)) {
        return;
    }

    try {
        const deletePromises = selectedUserIds.map(id => deleteDoc(doc(db, "users", id)));
        await Promise.all(deletePromises);
        showStatusMessage(`${selectedUserIds.length} usuário(s) removido(s) com sucesso.`);
        await loadMasterData();
        loadUsersInConfig();
        loadNetworksAndUsersForInventory();
        loadNetworksAndUsersForDryBoxes();
    } catch (error) {
        console.error("Erro ao remover usuários:", error);
        showStatusMessage("Erro ao remover usuários.", true);
    }
}
window.removeSelectedUsers = removeSelectedUsers;

function searchUsers() {
    loadUsersInConfig(); // Recarrega a lista com o termo de busca
}
window.searchUsers = searchUsers;

// Gerenciar Estados
async function addState() {
    const newStateInput = document.getElementById('newState');
    const stateName = newStateInput.value.trim();

    if (stateName) {
        try {
            // Verificar se o estado já existe para evitar duplicatas
            const existingStates = allStates.filter(s => s.name.toLowerCase() === stateName.toLowerCase());
            if (existingStates.length > 0) {
                showStatusMessage(`O estado "${stateName}" já existe.`, true);
                return;
            }
            await addDoc(collection(db, "states"), { name: stateName });
            newStateInput.value = '';
            showStatusMessage(`Estado "${stateName}" adicionado com sucesso.`);
            await loadMasterData();
            loadStatesInConfig();
            loadStatesForConfigDropdowns(); // Atualiza dropdowns de config
            loadStatesForForms(); // Atualiza dropdowns dos formulários de entrada
            loadStatesForDataViewDropdown(); // Atualiza dropdown de filtro de dados
        } catch (error) {
            console.error("Erro ao adicionar estado:", error);
            showStatusMessage("Erro ao adicionar estado.", true);
        }
    } else {
        showStatusMessage("Por favor, insira um nome para o estado.", true);
    }
}
window.addState = addState;

async function loadStatesInConfig() {
    const statesListDiv = document.getElementById('statesList');
    statesListDiv.innerHTML = 'Carregando estados...';
    const searchTerm = document.getElementById('searchState').value.toLowerCase();

    let filteredStates = allStates;
    if (searchTerm) {
        filteredStates = filteredStates.filter(s => s.name.toLowerCase().includes(searchTerm));
    }

    if (filteredStates.length === 0) {
        statesListDiv.innerHTML = '<p>Nenhum estado encontrado.</p>';
        return;
    }

    let html = '<ul class="config-list">';
    filteredStates.forEach(state => {
        html += `<li>
                    <input type="checkbox" data-id="${state.id}">
                    <span>${state.name}</span>
                 </li>`;
    });
    html += '</ul>';
    statesListDiv.innerHTML = html;
}
window.loadStatesInConfig = loadStatesInConfig;

function selectAllStates() {
    document.querySelectorAll('#statesList input[type="checkbox"]').forEach(cb => cb.checked = true);
}
window.selectAllStates = selectAllStates;

function deselectAllStates() {
    document.querySelectorAll('#statesList input[type="checkbox"]').forEach(cb => cb.checked = false);
}
window.deselectAllStates = deselectAllStates;

async function removeSelectedStates() {
    const selectedStateIds = Array.from(document.querySelectorAll('#statesList input[type="checkbox"]:checked'))
                               .map(cb => cb.dataset.id);
    if (selectedStateIds.length === 0) {
        showStatusMessage("Selecione os estados para remover.", true);
        return;
    }

    if (!confirm(`Tem certeza que deseja remover ${selectedStateIds.length} estado(s)? Isso removerá também redes, lojas e usuários associados a esses estados!`)) {
        return;
    }

    try {
        const deletePromises = selectedStateIds.map(async id => {
            // Remover redes, lojas e usuários associados a este estado
            const networksToDelete = allNetworks.filter(n => n.stateId === id);
            const storesToDelete = allStores.filter(s => networksToDelete.some(n => n.id === s.networkId));
            const usersToDelete = allUsers.filter(u => u.stateId === id);

            const networkDeletePromises = networksToDelete.map(n => deleteDoc(doc(db, "networks", n.id)));
            const storeDeletePromises = storesToDelete.map(s => deleteDoc(doc(db, "stores", s.id)));
            const userDeletePromises = usersToDelete.map(u => deleteDoc(doc(db, "users", u.id)));

            await Promise.all([...networkDeletePromises, ...storeDeletePromises, ...userDeletePromises]);
            return deleteDoc(doc(db, "states", id)); // Finalmente, remover o estado
        });
        await Promise.all(deletePromises);
        showStatusMessage(`${selectedStateIds.length} estado(s) e seus dados associados removido(s) com sucesso.`);
        await loadMasterData();
        loadStatesInConfig();
        loadStatesForConfigDropdowns();
        loadStatesForForms();
        loadStatesForDataViewDropdown();
    } catch (error) {
        console.error("Erro ao remover estados:", error);
        showStatusMessage("Erro ao remover estados. Verifique o console.", true);
    }
}
window.removeSelectedStates = removeSelectedStates;

function searchStates() {
    loadStatesInConfig();
}
window.searchStates = searchStates;


// Gerenciar Redes
async function addNetwork() {
    const newNetworkInput = document.getElementById('newNetwork');
    const networkStateSelect = document.getElementById('networkStateFilter'); // Use o filtro para pegar o estado
    const networkName = newNetworkInput.value.trim();
    const stateName = networkStateSelect.value;
    const state = allStates.find(s => s.name === stateName);

    if (networkName && state) {
        try {
            const existingNetworks = allNetworks.filter(n => n.name.toLowerCase() === networkName.toLowerCase() && n.stateId === state.id);
            if (existingNetworks.length > 0) {
                showStatusMessage(`A rede "${networkName}" já existe neste estado.`, true);
                return;
            }
            await addDoc(collection(db, "networks"), { name: networkName, stateId: state.id });
            newNetworkInput.value = '';
            showStatusMessage(`Rede "${networkName}" adicionada ao estado "${stateName}".`);
            await loadMasterData();
            loadNetworksInConfig();
            loadNetworksAndUsersForInventory();
            loadNetworksAndUsersForDryBoxes();
            loadNetworksForDataView();
        } catch (error) {
            console.error("Erro ao adicionar rede:", error);
            showStatusMessage("Erro ao adicionar rede.", true);
        }
    } else {
        showStatusMessage("Por favor, insira um nome de rede e selecione um estado.", true);
    }
}
window.addNetwork = addNetwork;

async function loadNetworksInConfig() {
    const networksListDiv = document.getElementById('networksList');
    networksListDiv.innerHTML = 'Carregando redes...';
    const filterStateName = document.getElementById('networkStateFilter').value;
    const searchTerm = document.getElementById('searchNetwork').value.toLowerCase();

    let filteredNetworks = allNetworks;
    if (filterStateName) {
        const state = allStates.find(s => s.name === filterStateName);
        if (state) {
            filteredNetworks = filteredNetworks.filter(n => n.stateId === state.id);
        }
    }
    if (searchTerm) {
        filteredNetworks = filteredNetworks.filter(n => n.name.toLowerCase().includes(searchTerm));
    }

    if (filteredNetworks.length === 0) {
        networksListDiv.innerHTML = '<p>Nenhuma rede encontrada.</p>';
        return;
    }

    let html = '<ul class="config-list">';
    filteredNetworks.forEach(network => {
        const networkState = allStates.find(s => s.id === network.stateId)?.name || 'Desconhecido';
        html += `<li>
                    <input type="checkbox" data-id="${network.id}">
                    <span>${network.name} (${networkState})</span>
                 </li>`;
    });
    html += '</ul>';
    networksListDiv.innerHTML = html;
    populateSelect('storeNetworkFilter', [{id: '', name: 'Selecione uma rede'}].concat(filteredNetworks), 'Selecione uma rede');
}
window.loadNetworksInConfig = loadNetworksInConfig;

function selectAllNetworks() {
    document.querySelectorAll('#networksList input[type="checkbox"]').forEach(cb => cb.checked = true);
}
window.selectAllNetworks = selectAllNetworks;

function deselectAllNetworks() {
    document.querySelectorAll('#networksList input[type="checkbox"]').forEach(cb => cb.checked = false);
}
window.deselectAllNetworks = deselectAllNetworks;

async function removeSelectedNetworks() {
    const selectedNetworkIds = Array.from(document.querySelectorAll('#networksList input[type="checkbox"]:checked'))
                                .map(cb => cb.dataset.id);
    if (selectedNetworkIds.length === 0) {
        showStatusMessage("Selecione as redes para remover.", true);
        return;
    }

    if (!confirm(`Tem certeza que deseja remover ${selectedNetworkIds.length} rede(s)? Isso removerá também as lojas associadas a essas redes!`)) {
        return;
    }

    try {
        const deletePromises = selectedNetworkIds.map(async id => {
            // Remover lojas associadas a esta rede
            const storesToDelete = allStores.filter(s => s.networkId === id);
            const storeDeletePromises = storesToDelete.map(s => deleteDoc(doc(db, "stores", s.id)));
            await Promise.all(storeDeletePromises);
            return deleteDoc(doc(db, "networks", id)); // Finalmente, remover a rede
        });
        await Promise.all(deletePromises);
        showStatusMessage(`${selectedNetworkIds.length} rede(s) e suas lojas associadas removida(s) com sucesso.`);
        await loadMasterData();
        loadNetworksInConfig();
        loadNetworksAndUsersForInventory();
        loadNetworksAndUsersForDryBoxes();
        loadNetworksForDataView();
        loadStoresInConfig();
    } catch (error) {
        console.error("Erro ao remover redes:", error);
        showStatusMessage("Erro ao remover redes. Verifique o console.", true);
    }
}
window.removeSelectedNetworks = removeSelectedNetworks;

function searchNetworks() {
    loadNetworksInConfig();
}
window.searchNetworks = searchNetworks;

// Gerenciar Lojas
async function addStore() {
    const newStoreInput = document.getElementById('newStore');
    const storeNetworkSelect = document.getElementById('storeNetworkFilter');
    const storeName = newStoreInput.value.trim();
    const networkName = storeNetworkSelect.value;
    const network = allNetworks.find(n => n.name === networkName);

    if (storeName && network) {
        try {
            const existingStores = allStores.filter(s => s.name.toLowerCase() === storeName.toLowerCase() && s.networkId === network.id);
            if (existingStores.length > 0) {
                showStatusMessage(`A loja "${storeName}" já existe nesta rede.`, true);
                return;
            }
            await addDoc(collection(db, "stores"), { name: storeName, networkId: network.id });
            newStoreInput.value = '';
            showStatusMessage(`Loja "${storeName}" adicionada à rede "${networkName}".`);
            await loadMasterData();
            loadStoresInConfig();
            loadStoresForInventory();
            loadStoresForDryBoxes();
        } catch (error) {
            console.error("Erro ao adicionar loja:", error);
            showStatusMessage("Erro ao adicionar loja.", true);
        }
    } else {
        showStatusMessage("Por favor, insira um nome de loja e selecione uma rede.", true);
    }
}
window.addStore = addStore;

async function loadStoresInConfig() {
    const storesListDiv = document.getElementById('storesList');
    storesListDiv.innerHTML = 'Carregando lojas...';
    const filterNetworkName = document.getElementById('storeNetworkFilter').value;
    const searchTerm = document.getElementById('searchStore').value.toLowerCase();

    let filteredStores = allStores;
    if (filterNetworkName) {
        const network = allNetworks.find(n => n.name === filterNetworkName);
        if (network) {
            filteredStores = filteredStores.filter(s => s.networkId === network.id);
        }
    }
    if (searchTerm) {
        filteredStores = filteredStores.filter(s => s.name.toLowerCase().includes(searchTerm));
    }

    if (filteredStores.length === 0) {
        storesListDiv.innerHTML = '<p>Nenhuma loja encontrada.</p>';
        return;
    }

    let html = '<ul class="config-list">';
    filteredStores.forEach(store => {
        const storeNetwork = allNetworks.find(n => n.id === store.networkId)?.name || 'Desconhecida';
        html += `<li>
                    <input type="checkbox" data-id="${store.id}">
                    <span>${store.name} (${storeNetwork})</span>
                 </li>`;
    });
    html += '</ul>';
    storesListDiv.innerHTML = html;
}
window.loadStoresInConfig = loadStoresInConfig;

function selectAllStores() {
    document.querySelectorAll('#storesList input[type="checkbox"]').forEach(cb => cb.checked = true);
}
window.selectAllStores = selectAllStores;

function deselectAllStores() {
    document.querySelectorAll('#storesList input[type="checkbox"]').forEach(cb => cb.checked = false);
}
window.deselectAllStores = deselectAllStores;

async function removeSelectedStores() {
    const selectedStoreIds = Array.from(document.querySelectorAll('#storesList input[type="checkbox"]:checked'))
                                .map(cb => cb.dataset.id);
    if (selectedStoreIds.length === 0) {
        showStatusMessage("Selecione as lojas para remover.", true);
        return;
    }

    if (!confirm(`Tem certeza que deseja remover ${selectedStoreIds.length} loja(s)?`)) {
        return;
    }

    try {
        const deletePromises = selectedStoreIds.map(id => deleteDoc(doc(db, "stores", id)));
        await Promise.all(deletePromises);
        showStatusMessage(`${selectedStoreIds.length} loja(s) removida(s) com sucesso.`);
        await loadMasterData();
        loadStoresInConfig();
        loadStoresForInventory();
        loadStoresForDryBoxes();
    } catch (error) {
        console.error("Erro ao remover lojas:", error);
        showStatusMessage("Erro ao remover lojas.", true);
    }
}
window.removeSelectedStores = removeSelectedStores;

function searchStores() {
    loadStoresInConfig();
}
window.searchStores = searchStores;

// Gerenciar Emails
async function addEmail() {
    const newEmailInput = document.getElementById('newEmail');
    const email = newEmailInput.value.trim();

    if (email && !allEmails.includes(email)) {
        try {
            allEmails.push(email);
            const configDocRef = doc(db, "configs", "appConfig");
            await setDoc(configDocRef, { emails: allEmails }, { merge: true });
            newEmailInput.value = '';
            showStatusMessage(`Email "${email}" adicionado com sucesso.`);
            loadEmailsInConfig();
        } catch (error) {
            console.error("Erro ao adicionar email:", error);
            showStatusMessage("Erro ao adicionar email.", true);
        }
    } else if (allEmails.includes(email)) {
        showStatusMessage("Este email já está na lista.", true);
    } else {
        showStatusMessage("Por favor, insira um email válido.", true);
    }
}
window.addEmail = addEmail;

async function loadEmailsInConfig() {
    const emailsListDiv = document.getElementById('emailsList');
    emailsListDiv.innerHTML = 'Carregando emails...';

    if (allEmails.length === 0) {
        emailsListDiv.innerHTML = '<p>Nenhum email cadastrado.</p>';
        return;
    }

    let html = '<ul class="config-list">';
    allEmails.forEach(email => {
        html += `<li>
                    <input type="checkbox" data-email="${email}">
                    <span>${email}</span>
                 </li>`;
    });
    html += '</ul>';
    emailsListDiv.innerHTML = html;
}
window.loadEmailsInConfig = loadEmailsInConfig;

function selectAllEmails() {
    document.querySelectorAll('#emailsList input[type="checkbox"]').forEach(cb => cb.checked = true);
}
window.selectAllEmails = selectAllEmails;

function deselectAllEmails() {
    document.querySelectorAll('#emailsList input[type="checkbox"]').forEach(cb => cb.checked = false);
}
window.deselectAllEmails = deselectAllEmails;

async function removeSelectedEmails() {
    const selectedEmails = Array.from(document.querySelectorAll('#emailsList input[type="checkbox"]:checked'))
                               .map(cb => cb.dataset.email);
    if (selectedEmails.length === 0) {
        showStatusMessage("Selecione os emails para remover.", true);
        return;
    }

    if (!confirm(`Tem certeza que deseja remover ${selectedEmails.length} email(s)?`)) {
        return;
    }

    try {
        allEmails = allEmails.filter(email => !selectedEmails.includes(email));
        const configDocRef = doc(db, "configs", "appConfig");
        await setDoc(configDocRef, { emails: allEmails }, { merge: true });
        showStatusMessage(`${selectedEmails.length} email(s) removido(s) com sucesso.`);
        loadEmailsInConfig();
    } catch (error) {
        console.error("Erro ao remover emails:", error);
        showStatusMessage("Erro ao remover emails.", true);
    }
}
window.removeSelectedEmails = removeSelectedEmails;


// Salvar todas as configurações (um wrapper para chamar todas as funções de salvamento de config)
async function saveAllConfigurations() {
    showStatusMessage("Salvando todas as configurações...", false);
    try {
        await saveScheduleSettings();
        // Não é necessário chamar os adds/removes aqui, eles já salvam automaticamente
        // Apenas recarregar as listas para garantir que estão atualizadas
        await loadMasterData();
        loadUsersInConfig();
        loadStatesInConfig();
        loadNetworksInConfig();
        loadStoresInConfig();
        loadEmailsInConfig();
        showStatusMessage("Todas as configurações salvas e atualizadas com sucesso!");
    } catch (error) {
        console.error("Erro ao salvar todas as configurações:", error);
        showStatusMessage("Erro ao salvar todas as configurações.", true);
    }
}
window.saveAllConfigurations = saveAllConfigurations;


// --- Funções de Visualização de Dados (Gestores) ---

async function loadDataView() {
    const dataType = document.getElementById('dataType').value;
    const dataStateName = document.getElementById('dataState').value;
    const dataNetworkName = document.getElementById('dataNetwork').value;

    const dataStatesView = document.getElementById('dataStatesView');
    const dataNetworksView = document.getElementById('dataNetworksView');
    const dataDetailsView = document.getElementById('dataDetailsView');
    const dataStatesList = document.getElementById('dataStatesList');
    const dataNetworksList = document.getElementById('dataNetworksList');
    const dataDetailsList = document.getElementById('dataDetailsList');

    // Esconde tudo e mostra apenas o que for relevante
    dataStatesView.style.display = 'block';
    dataNetworksView.style.display = 'none';
    dataDetailsView.style.display = 'none';
    document.getElementById('backToDataStates').style.display = 'none';
    document.getElementById('backToDataNetworks').style.display = 'none';

    dataStatesList.innerHTML = 'Carregando estados com dados...';

    try {
        let q = collection(db, dataType);
        let querySnapshot;

        // Mostrar estados
        const statesWithData = new Set();
        const fullSnapshot = await getDocs(q);
        fullSnapshot.forEach(doc => {
            const data = doc.data();
            if (data.state) statesWithData.add(data.state);
        });

        if (statesWithData.size === 0) {
            dataStatesList.innerHTML = '<p>Nenhum dado encontrado para exibir.</p>';
            return;
        }

        let html = '<ul class="data-drilldown-list">';
        Array.from(statesWithData).sort().forEach(stateName => {
            html += `<li><a href="#" onclick="showDataNetworks('${stateName}')">${stateName}</a></li>`;
        });
        html += '</ul>';
        dataStatesList.innerHTML = html;

    } catch (error) {
        console.error("Erro ao carregar dados para a visualização:", error);
        dataStatesList.innerHTML = '<p class="status-error">Erro ao carregar dados.</p>';
    }
}
window.loadDataView = loadDataView;

async function showDataNetworks(stateName) {
    document.getElementById('dataStatesView').style.display = 'none';
    document.getElementById('dataNetworksView').style.display = 'block';
    document.getElementById('dataDetailsView').style.display = 'none';
    document.getElementById('backToDataStates').style.display = 'block';
    document.getElementById('backToDataNetworks').style.display = 'none';
    document.getElementById('dataNetworksTitle').textContent = `Redes em ${stateName}`;
    
    const dataType = document.getElementById('dataType').value;
    const dataNetworksList = document.getElementById('dataNetworksList');
    dataNetworksList.innerHTML = 'Carregando redes...';

    try {
        const q = query(collection(db, dataType), where("state", "==", stateName));
        const querySnapshot = await getDocs(q);
        
        const networksWithData = new Set();
        querySnapshot.forEach(doc => {
            const data = doc.data();
            if (data.network) networksWithData.add(data.network);
        });

        if (networksWithData.size === 0) {
            dataNetworksList.innerHTML = '<p>Nenhuma rede com dados encontrada neste estado.</p>';
            return;
        }

        let html = '<ul class="data-drilldown-list">';
        Array.from(networksWithData).sort().forEach(networkName => {
            html += `<li><a href="#" onclick="showDataDetails('${stateName}', '${networkName}')">${networkName}</a></li>`;
        });
        html += '</ul>';
        dataNetworksList.innerHTML = html;

    } catch (error) {
        console.error("Erro ao carregar redes para a visualização:", error);
        dataNetworksList.innerHTML = '<p class="status-error">Erro ao carregar redes.</p>';
    }
}
window.showDataNetworks = showDataNetworks;

async function showDataDetails(stateName, networkName) {
    document.getElementById('dataStatesView').style.display = 'none';
    document.getElementById('dataNetworksView').style.display = 'none';
    document.getElementById('dataDetailsView').style.display = 'block';
    document.getElementById('backToDataStates').style.display = 'block';
    document.getElementById('backToDataNetworks').style.display = 'block';
    document.getElementById('dataDetailsTitle').textContent = `Dados Detalhados em ${networkName}, ${stateName}`;
    
    const dataType = document.getElementById('dataType').value;
    const dataDetailsList = document.getElementById('dataDetailsList');
    dataDetailsList.innerHTML = 'Carregando detalhes...';

    try {
        const q = query(collection(db, dataType), 
                        where("state", "==", stateName),
                        where("network", "==", networkName),
                        orderBy("timestamp", "desc"));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            dataDetailsList.innerHTML = '<p>Nenhum detalhe encontrado para esta rede e estado.</p>';
            return;
        }

        let html = '<ul class="data-list">';
        querySnapshot.forEach(doc => {
            const data = doc.data();
            const timestamp = data.timestamp ? new Date(data.timestamp.toDate()).toLocaleString() : 'N/A';
            if (dataType === 'inventory') {
                html += `<li><strong>${data.productType} (${data.boxType})</strong>: ${data.quantity} caixas - Loja: ${data.store}, Usuário: ${data.user} (${timestamp})</li>`;
            } else if (dataType === 'dryBoxes') {
                html += `<li><strong>${data.boxType}</strong>: ${data.quantity} caixas - Loja: ${data.store}, Usuário: ${data.user} (${timestamp})</li>`;
            }
        });
        html += '</ul>';
        dataDetailsList.innerHTML = html;

    } catch (error) {
        console.error("Erro ao carregar detalhes dos dados:", error);
        dataDetailsList.innerHTML = '<p class="status-error">Erro ao carregar detalhes.</p>';
    }
}
window.showDataDetails = showDataDetails;

// Voltar na navegação de dados
window.backToDataStates = loadDataView; // Já existe no HTML
function backToDataNetworks() {
    const selectedStateName = document.getElementById('dataState').value;
    showDataNetworks(selectedStateName);
}
window.backToDataNetworks = backToDataNetworks;


// --- Funções de Usuários Pendentes (Gestores) ---

async function loadPendingUsersView() {
    const pendingType = document.getElementById('pendingType').value; // 'inventory' ou 'dryBoxes'
    const pendingStatesList = document.getElementById('pendingStatesList');
    const pendingNetworksList = document.getElementById('pendingNetworksList');
    const pendingUsersList = document.getElementById('pendingUsersList');

    // Esconde tudo e mostra a primeira visão
    document.getElementById('pendingStatesView').style.display = 'block';
    document.getElementById('pendingNetworksView').style.display = 'none';
    document.getElementById('pendingUsersView').style.display = 'none';
    document.getElementById('backToPendingStates').style.display = 'none';
    document.getElementById('backToPendingNetworks').style.display = 'none';

    pendingStatesList.innerHTML = 'Carregando estados...';

    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Zera a hora para comparar o dia

        const usersWhoSubmittedToday = new Set();
        const qSubmitted = query(
            collection(db, pendingType),
            where("timestamp", ">=", today) // Buscar envios de hoje
        );
        const submittedSnapshot = await getDocs(qSubmitted);
        submittedSnapshot.forEach(doc => {
            usersWhoSubmittedToday.add(doc.data().userId);
        });

        // Filtrar usuários que NÃO enviaram hoje
        const usersNotSubmitted = allUsers.filter(user => !usersWhoSubmittedToday.has(user.id));
        
        const statesWithPendingUsers = new Set();
        usersNotSubmitted.forEach(user => {
            const state = allStates.find(s => s.id === user.stateId);
            if (state) statesWithPendingUsers.add(state.name);
        });

        if (statesWithPendingUsers.size === 0) {
            pendingStatesList.innerHTML = '<p>Todos os usuários enviaram para o tipo selecionado.</p>';
            return;
        }

        let html = '<ul class="data-drilldown-list">';
        Array.from(statesWithPendingUsers).sort().forEach(stateName => {
            html += `<li><a href="#" onclick="showPendingNetworks('${stateName}', '${pendingType}')">${stateName}</a></li>`;
        });
        html += '</ul>';
        pendingStatesList.innerHTML = html;

    } catch (error) {
        console.error("Erro ao carregar usuários pendentes:", error);
        pendingStatesList.innerHTML = '<p class="status-error">Erro ao carregar usuários pendentes.</p>';
    }
}
window.loadPendingUsersView = loadPendingUsersView;

async function showPendingNetworks(stateName, pendingType) {
    document.getElementById('pendingStatesView').style.display = 'none';
    document.getElementById('pendingNetworksView').style.display = 'block';
    document.getElementById('pendingUsersView').style.display = 'none';
    document.getElementById('backToPendingStates').style.display = 'block';
    document.getElementById('backToPendingNetworks').style.display = 'none';
    document.getElementById('pendingNetworksTitle').textContent = `Redes com Usuários Pendentes em ${stateName}`;
    
    const pendingNetworksList = document.getElementById('pendingNetworksList');
    pendingNetworksList.innerHTML = 'Carregando redes...';

    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const usersWhoSubmittedToday = new Set();
        const qSubmitted = query(
            collection(db, pendingType),
            where("timestamp", ">=", today),
            where("state", "==", stateName)
        );
        const submittedSnapshot = await getDocs(qSubmitted);
        submittedSnapshot.forEach(doc => {
            usersWhoSubmittedToday.add(doc.data().userId);
        });

        const stateDoc = allStates.find(s => s.name === stateName);
        const networksInState = allNetworks.filter(n => n.stateId === stateDoc.id);

        const networksWithPendingUsers = new Set();
        for (const network of networksInState) {
            const usersInNetwork = allUsers.filter(u => u.stateId === stateDoc.id && allStores.some(s => s.networkId === network.id && s.name === u.store)); // Simplificado: assumindo que user.store é o nome da loja
            // Melhor: filtrar usuários por rede baseando-se em `storeId` se sua estrutura de `users` incluir isso
            // Ex: const usersInNetwork = allUsers.filter(u => u.stateId === stateDoc.id && u.networkId === network.id);

            const pendingUsersInNetwork = usersInNetwork.filter(user => !usersWhoSubmittedToday.has(user.id));
            if (pendingUsersInNetwork.length > 0) {
                networksWithPendingUsers.add(network.name);
            }
        }

        if (networksWithPendingUsers.size === 0) {
            pendingNetworksList.innerHTML = '<p>Nenhuma rede com usuários pendentes neste estado.</p>';
            return;
        }

        let html = '<ul class="data-drilldown-list">';
        Array.from(networksWithPendingUsers).sort().forEach(networkName => {
            html += `<li><a href="#" onclick="showPendingUsers('${stateName}', '${networkName}', '${pendingType}')">${networkName}</a></li>`;
        });
        html += '</ul>';
        pendingNetworksList.innerHTML = html;

    } catch (error) {
        console.error("Erro ao carregar redes para usuários pendentes:", error);
        pendingNetworksList.innerHTML = '<p class="status-error">Erro ao carregar redes.</p>';
    }
}
window.showPendingNetworks = showPendingNetworks;

async function showPendingUsers(stateName, networkName, pendingType) {
    document.getElementById('pendingStatesView').style.display = 'none';
    document.getElementById('pendingNetworksView').style.display = 'none';
    document.getElementById('pendingUsersView').style.display = 'block';
    document.getElementById('backToPendingStates').style.display = 'block';
    document.getElementById('backToPendingNetworks').style.display = 'block';
    document.getElementById('pendingUsersTitle').textContent = `Usuários Pendentes em ${networkName}, ${stateName}`;
    
    const pendingUsersList = document.getElementById('pendingUsersList');
    pendingUsersList.innerHTML = 'Carregando usuários...';

    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const usersWhoSubmittedToday = new Set();
        const qSubmitted = query(
            collection(db, pendingType),
            where("timestamp", ">=", today),
            where("state", "==", stateName),
            where("network", "==", networkName) // Assumindo que o campo 'network' está no documento de envio
        );
        const submittedSnapshot = await getDocs(qSubmitted);
        submittedSnapshot.forEach(doc => {
            usersWhoSubmittedToday.add(doc.data().userId);
        });

        const stateDoc = allStates.find(s => s.name === stateName);
        const networkDoc = allNetworks.find(n => n.name === networkName && n.stateId === stateDoc.id);

        let usersInThisNetworkAndState = [];
        if (stateDoc && networkDoc) {
            // Este filtro é uma suposição, a precisão depende de como 'users' estão ligados a 'stores' e 'networks'
            // Idealmente, seu objeto 'user' teria 'stateId' e 'networkId' diretamente para facilitar.
            usersInThisNetworkAndState = allUsers.filter(u => 
                u.stateId === stateDoc.id && 
                allStores.some(s => s.networkId === networkDoc.id && s.id === u.storeId) // Se user tiver 'storeId'
            );
        }

        const pendingUsers = usersInThisNetworkAndState.filter(user => !usersWhoSubmittedToday.has(user.id));

        if (pendingUsers.length === 0) {
            pendingUsersList.innerHTML = '<p>Nenhum usuário pendente nesta rede e estado.</p>';
            return;
        }

        let html = '<ul class="data-list">';
        pendingUsers.sort((a,b) => a.name.localeCompare(b.name)).forEach(user => {
            html += `<li>${user.name}</li>`;
        });
        html += '</ul>';
        pendingUsersList.innerHTML = html;

    } catch (error) {
        console.error("Erro ao carregar usuários pendentes detalhados:", error);
        pendingUsersList.innerHTML = '<p class="status-error">Erro ao carregar usuários.</p>';
    }
}
window.showPendingUsers = showPendingUsers;

// Voltar na navegação de pendências
window.backToPendingStates = loadPendingUsersView;
function backToPendingNetworks() {
    const selectedStateName = document.getElementById('pendingState').value; // Você precisaria de um select 'pendingState' para isso
    // Por enquanto, apenas recarrega a visão principal de pendentes
    loadPendingUsersView();
}
window.backToPendingNetworks = backToPendingNetworks;


// --- Event Listeners e Inicialização ---
document.addEventListener('DOMContentLoaded', async () => {
    // Carrega todos os dados mestres do Firestore ao iniciar a página
    await loadMasterData();
    
    // Inicia os contadores (usando os horários carregados ou padrão)
    const [invHour, invMin] = currentSchedule.inventory.time.split(':').map(Number);
    startCountdown('inventoryCountdown', invHour, invMin);
    
    const [dryHour, dryMin] = currentSchedule.dryBoxes.time.split(':').map(Number);
    // Para caixas secas, se segunda-feira estiver nos dias de envio agendados, use a lógica de dia da semana
    if (currentSchedule.dryBoxes.days.includes(1)) { // 1 = Segunda-feira
        startCountdown('dryBoxesCountdown', dryHour, dryMin, 1); 
    } else {
        startCountdown('dryBoxesCountdown', dryHour, dryMin); // Comportamento padrão (dia atual)
    }

    // Inicializa os dropdowns dos formulários de entrada
    loadStatesForForms();

    // Adiciona event listeners aos formulários
    const stockForm = document.getElementById('stockForm');
    if (stockForm) {
        stockForm.addEventListener('submit', submitInventoryForm);
    }

    const dryBoxesForm = document.getElementById('dryBoxesForm');
    if (dryBoxesForm) {
        dryBoxesForm.addEventListener('submit', submitDryBoxesForm);
    }
    
    // Carregar os últimos itens adicionados para as listas
    loadLatestInventoryItems();
    loadLatestDryBoxItems();

    // Inicializa a primeira aba
    showTab('inventory');

    // Inicializa os dropdowns da área de configuração quando a página carrega
    loadStatesForConfigDropdowns();
    loadNetworksInConfig(); // Precisa ser chamado para popular o filtro de rede na config
    loadStoresInConfig();
    loadEmailsInConfig();
    applyScheduleSettingsToUI();
});

// Exponha funções globais para o HTML (se usadas com onclick, onchange, etc.)
window.showTab = showTab;
window.showManagerTab = showManagerTab;
window.loadNetworksAndUsersForInventory = loadNetworksAndUsersForInventory;
window.loadStoresForInventory = loadStoresForInventory;
window.loadNetworksAndUsersForDryBoxes = loadNetworksAndUsersForDryBoxes;
window.loadStoresForDryBoxes = loadStoresForDryBoxes;

// Funções de gerenciamento expostas globalmente
window.loadUsersInConfig = loadUsersInConfig;
window.searchUsers = searchUsers;
window.selectAllUsers = selectAllUsers;
window.deselectAllUsers = deselectAllUsers;
window.removeSelectedUsers = removeSelectedUsers;

window.loadStatesInConfig = loadStatesInConfig;
window.searchStates = searchStates;
window.selectAllStates = selectAllStates;
window.deselectAllStates = deselectAllStates;
window.removeSelectedStates = removeSelectedStates;

window.loadNetworksInConfig = loadNetworksInConfig;
window.searchNetworks = searchNetworks;
window.selectAllNetworks = selectAllNetworks;
window.deselectAllNetworks = deselectAllNetworks;
window.removeSelectedNetworks = removeSelectedNetworks;

window.loadStoresInConfig = loadStoresInConfig;
window.searchStores = searchStores;
window.selectAllStores = selectAllStores;
window.deselectAllStores = deselectAllStores;
window.removeSelectedStores = removeSelectedStores;

window.loadEmailsInConfig = loadEmailsInConfig;
window.selectAllEmails = selectAllEmails;
window.deselectAllEmails = deselectAllEmails;
window.removeSelectedEmails = removeSelectedEmails;

window.loadDataView = loadDataView;
window.loadNetworksForDataView = loadNetworksForDataView;
window.loadPendingUsersView = loadPendingUsersView;