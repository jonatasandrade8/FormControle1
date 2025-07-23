
// Dados das redes por estado
const networksByState = {
    "Rio Grande do Norte": ["Rede Nordeste", "Rede RN"],
    "São Paulo": ["Rede Sul", "Rede Sudeste"],
    "Rio de Janeiro": ["Rede Rio", "Rede Sudeste"],
    "Minas Gerais": ["Rede Centro", "Rede Sudeste"],
    "Bahia": ["Rede Nordeste", "Rede Bahia"]
};

// Dados das lojas por rede
const storesByNetwork = {
    "Rede Nordeste": ["Loja Nordeste Shopping", "Loja Nordeste Center", "Loja Nordeste Plaza"],
    "Rede RN": ["Loja RN Shopping", "Rede RN Center", "Loja RN Plaza"],
    "Rede Sul": ["Loja Sul Shopping", "Loja Sul Center", "Loja Sul Plaza"],
    "Rede Sudeste": ["Loja Sudeste Shopping", "Loja Sudeste Center", "Loja Sudeste Plaza"],
    "Rede Rio": ["Loja Rio Shopping", "Loja Rio Center", "Loja Rio Plaza"],
    "Rede Centro": ["Loja Centro Shopping", "Loja Centro Mall", "Loja Centro Plaza"],
    "Rede Bahia": ["Loja Bahia Shopping", "Loja Bahia Center", "Loja Bahia Plaza"]
};

// Arrays para armazenar os itens
let inventoryItems = [];
let dryBoxesItems = [];

// Listas de envio (simulam envios pendentes)
let inventorySubmissionQueue = [];
let dryBoxesSubmissionQueue = [];

// Status de envios por usuário/região/rede
let submissionStatus = {
    inventory: {},
    dryBoxes: {}
};

// Função para mostrar/esconder abas
function showTab(tabName) {
    // Esconder todas as abas
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Remover classe active de todos os botões
    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Mostrar aba selecionada
    document.getElementById(tabName + 'Tab').classList.add('active');
    event.target.classList.add('active');
    
    // Atualizar visualização se for a aba de gestor
    if (tabName === 'manager') {
        updateManagerView();
    }
}

// Funções para atualizar redes baseado no estado
function updateNetworksByState() {
    const stateSelect = document.getElementById('state');
    const networkSelect = document.getElementById('network');
    const selectedState = stateSelect.value;
    
    networkSelect.innerHTML = '<option value="">Selecione uma rede</option>';
    
    if (selectedState && networksByState[selectedState]) {
        networksByState[selectedState].forEach(network => {
            const option = document.createElement('option');
            option.value = network;
            option.textContent = network;
            networkSelect.appendChild(option);
        });
    }
    
    // Limpar seleção de loja
    document.getElementById('store').innerHTML = '<option value="">Selecione uma loja</option>';
}

function updateDryNetworksByState() {
    const stateSelect = document.getElementById('dryState');
    const networkSelect = document.getElementById('dryNetwork');
    const selectedState = stateSelect.value;
    
    networkSelect.innerHTML = '<option value="">Selecione uma rede</option>';
    
    if (selectedState && networksByState[selectedState]) {
        networksByState[selectedState].forEach(network => {
            const option = document.createElement('option');
            option.value = network;
            option.textContent = network;
            networkSelect.appendChild(option);
        });
    }
    
    // Limpar seleção de loja
    document.getElementById('dryStore').innerHTML = '<option value="">Selecione uma loja</option>';
}

// Funções para atualizar lojas baseado na rede
function updateStores() {
    const networkSelect = document.getElementById('network');
    const storeSelect = document.getElementById('store');
    const selectedNetwork = networkSelect.value;
    
    storeSelect.innerHTML = '<option value="">Selecione uma loja</option>';
    
    if (selectedNetwork && storesByNetwork[selectedNetwork]) {
        storesByNetwork[selectedNetwork].forEach(store => {
            const option = document.createElement('option');
            option.value = store;
            option.textContent = store;
            storeSelect.appendChild(option);
        });
    }
}

function updateDryStores() {
    const networkSelect = document.getElementById('dryNetwork');
    const storeSelect = document.getElementById('dryStore');
    const selectedNetwork = networkSelect.value;
    
    storeSelect.innerHTML = '<option value="">Selecione uma loja</option>';
    
    if (selectedNetwork && storesByNetwork[selectedNetwork]) {
        storesByNetwork[selectedNetwork].forEach(store => {
            const option = document.createElement('option');
            option.value = store;
            option.textContent = store;
            storeSelect.appendChild(option);
        });
    }
}

// Formulário de inventário
document.getElementById('stockForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const formData = new FormData(this);
    const item = {
        user: formData.get('user'),
        state: formData.get('state'),
        network: formData.get('network'),
        store: formData.get('store'),
        productType: formData.get('productType'),
        boxType: formData.get('boxType'),
        quantity: parseInt(formData.get('quantity'))
    };
    
    inventoryItems.push(item);
    updateInventoryDisplay();
    
    // Limpar campos específicos
    document.getElementById('productType').value = '';
    document.getElementById('boxType').value = '';
    document.getElementById('quantity').value = '';
    
    document.getElementById('submitInventory').style.display = 'block';
    showStatus('Item adicionado com sucesso!', 'success');
});

// Formulário de caixas secas
document.getElementById('dryBoxesForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const formData = new FormData(this);
    const item = {
        user: formData.get('dryUser'),
        state: formData.get('dryState'),
        network: formData.get('dryNetwork'),
        store: formData.get('dryStore'),
        boxType: formData.get('dryBoxType'),
        quantity: parseInt(formData.get('dryQuantity'))
    };
    
    dryBoxesItems.push(item);
    updateDryBoxesDisplay();
    
    // Limpar campos específicos
    document.getElementById('dryBoxType').value = '';
    document.getElementById('dryQuantity').value = '';
    
    document.getElementById('submitDryBoxes').style.display = 'block';
    showStatus('Caixa seca adicionada com sucesso!', 'success');
});

// Função para atualizar exibição do inventário
function updateInventoryDisplay() {
    const itemsContainer = document.getElementById('items');
    
    if (inventoryItems.length === 0) {
        itemsContainer.innerHTML = '<p>Nenhum item adicionado ainda.</p>';
        document.getElementById('submitInventory').style.display = 'none';
        return;
    }
    
    const itemsByState = {};
    inventoryItems.forEach((item, index) => {
        if (!itemsByState[item.state]) {
            itemsByState[item.state] = {};
        }
        if (!itemsByState[item.state][item.network]) {
            itemsByState[item.state][item.network] = [];
        }
        itemsByState[item.state][item.network].push({...item, index});
    });
    
    let html = '';
    Object.keys(itemsByState).forEach(state => {
        html += `<div class="state-group">
            <div class="state-title">${state}</div>`;
        
        Object.keys(itemsByState[state]).forEach(network => {
            html += `<div class="network-group">
                <div class="network-title">${network}</div>`;
            
            itemsByState[state][network].forEach(item => {
                html += `<div class="item">
                    <div class="item-info">
                        <strong>${item.productType}</strong> - ${item.store}
                        <div class="item-details">
                            Usuário: ${item.user} | Caixa: ${item.boxType} | Quantidade: ${item.quantity}
                        </div>
                    </div>
                    <button class="remove-btn" onclick="removeInventoryItem(${item.index})">Remover</button>
                </div>`;
            });
            
            html += '</div>';
        });
        
        html += '</div>';
    });
    
    itemsContainer.innerHTML = html;
}

// Função para atualizar exibição das caixas secas
function updateDryBoxesDisplay() {
    const itemsContainer = document.getElementById('dryBoxesItems');
    
    if (dryBoxesItems.length === 0) {
        itemsContainer.innerHTML = '<p>Nenhuma caixa seca adicionada ainda.</p>';
        document.getElementById('submitDryBoxes').style.display = 'none';
        return;
    }
    
    const itemsByState = {};
    dryBoxesItems.forEach((item, index) => {
        if (!itemsByState[item.state]) {
            itemsByState[item.state] = {};
        }
        if (!itemsByState[item.state][item.network]) {
            itemsByState[item.state][item.network] = [];
        }
        itemsByState[item.state][item.network].push({...item, index});
    });
    
    let html = '';
    Object.keys(itemsByState).forEach(state => {
        html += `<div class="state-group">
            <div class="state-title">${state}</div>`;
        
        Object.keys(itemsByState[state]).forEach(network => {
            html += `<div class="network-group">
                <div class="network-title">${network}</div>`;
            
            itemsByState[state][network].forEach(item => {
                html += `<div class="item">
                    <div class="item-info">
                        <strong>${item.boxType}</strong> - ${item.store}
                        <div class="item-details">
                            Usuário: ${item.user} | Quantidade: ${item.quantity}
                        </div>
                    </div>
                    <button class="remove-btn" onclick="removeDryBoxItem(${item.index})">Remover</button>
                </div>`;
            });
            
            html += '</div>';
        });
        
        html += '</div>';
    });
    
    itemsContainer.innerHTML = html;
}

// Funções para remover itens
function removeInventoryItem(index) {
    inventoryItems.splice(index, 1);
    updateInventoryDisplay();
}

function removeDryBoxItem(index) {
    dryBoxesItems.splice(index, 1);
    updateDryBoxesDisplay();
}

// Função para adicionar à lista de envio
function submitToQueue(type) {
    let items, container;
    
    if (type === 'inventory') {
        if (inventoryItems.length === 0) {
            showStatus('Nenhum item para adicionar à lista!', 'error');
            return;
        }
        items = [...inventoryItems];
        container = 'submitInventory';
        inventorySubmissionQueue.push({
            timestamp: new Date(),
            items: items,
            user: items[0].user,
            state: items[0].state,
            network: items[0].network,
            store: items[0].store
        });
        
        // Marcar como enviado no status
        const key = `${items[0].state}-${items[0].network}-${items[0].user}`;
        submissionStatus.inventory[key] = {
            user: items[0].user,
            state: items[0].state,
            network: items[0].network,
            store: items[0].store,
            timestamp: new Date()
        };
        
        inventoryItems = [];
        updateInventoryDisplay();
        showStatus('Inventário adicionado à lista de envio!', 'success');
        
    } else if (type === 'dryBoxes') {
        if (dryBoxesItems.length === 0) {
            showStatus('Nenhuma caixa seca para adicionar à lista!', 'error');
            return;
        }
        items = [...dryBoxesItems];
        container = 'submitDryBoxes';
        dryBoxesSubmissionQueue.push({
            timestamp: new Date(),
            items: items,
            user: items[0].user,
            state: items[0].state,
            network: items[0].network,
            store: items[0].store
        });
        
        // Marcar como enviado no status
        const key = `${items[0].state}-${items[0].network}-${items[0].user}`;
        submissionStatus.dryBoxes[key] = {
            user: items[0].user,
            state: items[0].state,
            network: items[0].network,
            store: items[0].store,
            timestamp: new Date()
        };
        
        dryBoxesItems = [];
        updateDryBoxesDisplay();
        showStatus('Caixas secas adicionadas à lista de envio!', 'success');
    }
    
    updateSubmissionStatus();
}

// Função para atualizar status de envios
function updateSubmissionStatus() {
    // Status do inventário
    const inventoryContainer = document.getElementById('inventorySubmissions');
    let inventoryHtml = '';
    
    Object.values(submissionStatus.inventory).forEach(submission => {
        inventoryHtml += `<div class="submission-item">
            <span class="submitted">✓</span> ${submission.user} da ${submission.network} da ${submission.store} já enviou
            <small>(${submission.timestamp.toLocaleString()})</small>
        </div>`;
    });
    
    if (inventoryHtml === '') {
        inventoryHtml = '<p>Nenhum envio registrado ainda.</p>';
    }
    
    inventoryContainer.innerHTML = inventoryHtml;
    
    // Status das caixas secas
    const dryBoxesContainer = document.getElementById('dryBoxesSubmissions');
    let dryBoxesHtml = '';
    
    Object.values(submissionStatus.dryBoxes).forEach(submission => {
        dryBoxesHtml += `<div class="submission-item">
            <span class="submitted">✓</span> ${submission.user} da ${submission.network} da ${submission.store} já enviou
            <small>(${submission.timestamp.toLocaleString()})</small>
        </div>`;
    });
    
    if (dryBoxesHtml === '') {
        dryBoxesHtml = '<p>Nenhum envio registrado ainda.</p>';
    }
    
    dryBoxesContainer.innerHTML = dryBoxesHtml;
}

// Função para atualizar visualização do gestor
function updateManagerView() {
    const stateFilter = document.getElementById('managerState').value;
    const networkFilter = document.getElementById('managerNetwork').value;
    
    // Atualizar filtro de rede baseado no estado
    if (stateFilter) {
        const networkSelect = document.getElementById('managerNetwork');
        networkSelect.innerHTML = '<option value="">Todas as redes</option>';
        
        if (networksByState[stateFilter]) {
            networksByState[stateFilter].forEach(network => {
                const option = document.createElement('option');
                option.value = network;
                option.textContent = network;
                if (network === networkFilter) option.selected = true;
                networkSelect.appendChild(option);
            });
        }
    }
    
    // Exibir dados do inventário
    updateManagerInventoryView(stateFilter, networkFilter);
    updateManagerDryBoxesView(stateFilter, networkFilter);
}

function updateManagerInventoryView(stateFilter, networkFilter) {
    const container = document.getElementById('managerInventoryData');
    let html = '';
    
    Object.values(submissionStatus.inventory).forEach(submission => {
        if ((!stateFilter || submission.state === stateFilter) &&
            (!networkFilter || submission.network === networkFilter)) {
            html += `<div class="manager-submission">
                <strong>${submission.user}</strong> - ${submission.store}
                <div class="submission-details">
                    Estado: ${submission.state} | Rede: ${submission.network}
                    <br>Enviado em: ${submission.timestamp.toLocaleString()}
                </div>
            </div>`;
        }
    });
    
    if (html === '') {
        html = '<p>Nenhum envio encontrado para os filtros selecionados.</p>';
    }
    
    container.innerHTML = html;
}

function updateManagerDryBoxesView(stateFilter, networkFilter) {
    const container = document.getElementById('managerDryBoxesData');
    let html = '';
    
    Object.values(submissionStatus.dryBoxes).forEach(submission => {
        if ((!stateFilter || submission.state === stateFilter) &&
            (!networkFilter || submission.network === networkFilter)) {
            html += `<div class="manager-submission">
                <strong>${submission.user}</strong> - ${submission.store}
                <div class="submission-details">
                    Estado: ${submission.state} | Rede: ${submission.network}
                    <br>Enviado em: ${submission.timestamp.toLocaleString()}
                </div>
            </div>`;
        }
    });
    
    if (html === '') {
        html = '<p>Nenhum envio encontrado para os filtros selecionados.</p>';
    }
    
    container.innerHTML = html;
}

// Funções de contagem regressiva
function updateCountdowns() {
    updateInventoryCountdown();
    updateDryBoxesCountdown();
}

function updateInventoryCountdown() {
    const now = new Date();
    const target = new Date();
    target.setHours(13, 0, 0, 0);
    
    if (now > target) {
        target.setDate(target.getDate() + 1);
    }
    
    const timeDiff = target - now;
    const hours = Math.floor(timeDiff / (1000 * 60 * 60));
    const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);
    
    const countdownElement = document.getElementById('inventoryCountdown');
    countdownElement.innerHTML = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function updateDryBoxesCountdown() {
    const now = new Date();
    const target = new Date();
    
    // Encontrar próxima segunda-feira às 13:00
    const dayOfWeek = now.getDay();
    const daysUntilMonday = dayOfWeek === 0 ? 1 : (8 - dayOfWeek);
    
    target.setDate(now.getDate() + daysUntilMonday);
    target.setHours(13, 0, 0, 0);
    
    // Se hoje é segunda e ainda não passou das 13:00
    if (dayOfWeek === 1 && now.getHours() < 13) {
        target.setDate(now.getDate());
    }
    
    const timeDiff = target - now;
    const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);
    
    const countdownElement = document.getElementById('dryBoxesCountdown');
    countdownElement.innerHTML = `${days}d ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

// Função para envio automático
function processAutomaticSubmissions() {
    const now = new Date();
    
    // Verificar envio de inventário (13:00 todos os dias)
    if (now.getHours() === 13 && now.getMinutes() === 0) {
        if (inventorySubmissionQueue.length > 0) {
            console.log('Enviando inventários automaticamente:', inventorySubmissionQueue);
            inventorySubmissionQueue = [];
            showStatus('Inventários enviados automaticamente!', 'success');
        }
    }
    
    // Verificar envio de caixas secas (segunda-feira às 13:00)
    if (now.getDay() === 1 && now.getHours() === 13 && now.getMinutes() === 0) {
        if (dryBoxesSubmissionQueue.length > 0) {
            console.log('Enviando caixas secas automaticamente:', dryBoxesSubmissionQueue);
            dryBoxesSubmissionQueue = [];
            showStatus('Caixas secas enviadas automaticamente!', 'success');
        }
    }
}

// Função para mostrar status
function showStatus(message, type) {
    const statusDiv = document.getElementById('status');
    statusDiv.textContent = message;
    statusDiv.className = type;
    
    if (message) {
        setTimeout(() => {
            statusDiv.textContent = '';
            statusDiv.className = '';
        }, 3000);
    }
}

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    updateInventoryDisplay();
    updateDryBoxesDisplay();
    updateSubmissionStatus();
    
    // Atualizar contagens regressivas a cada segundo
    setInterval(updateCountdowns, 1000);
    
    // Verificar envios automáticos a cada minuto
    setInterval(processAutomaticSubmissions, 60000);
    
    updateCountdowns();
    
    console.log('Sistema de contagem de estoque inicializado');
});
