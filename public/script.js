
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

// Senha dos gestores (em produção, isso deveria estar no backend)
const MANAGER_PASSWORD = "gestor123";

// Estado de autenticação do gestor
let managerAuthenticated = false;

// Estado da navegação de usuários pendentes
let pendingViewState = {
    level: 'states', // 'states', 'networks', 'users'
    selectedState: null,
    selectedNetwork: null
};

// Estado da navegação de dados
let dataViewState = {
    level: 'states', // 'states', 'networks', 'details'
    selectedState: null,
    selectedNetwork: null
};

// Configurações do sistema
let systemConfig = {
    inventoryTime: "13:00",
    inventoryDays: [1, 2, 3, 4, 5], // Segunda a sexta por padrão
    dryBoxesTime: "13:00",
    dryBoxesDays: [1], // Segunda por padrão
    usersByState: {
        "Rio Grande do Norte": ["João Silva", "Maria Santos"],
        "São Paulo": ["Pedro Costa", "Ana Oliveira"],
        "Rio de Janeiro": ["Carlos Ferreira"],
        "Minas Gerais": [],
        "Bahia": []
    },
    emails: [
        { address: "admin@empresa.com", inventory: true, dryBoxes: true },
        { address: "gestor@empresa.com", inventory: true, dryBoxes: true }
    ]
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
    
    // Verificar autenticação se for a aba de gestor
    if (tabName === 'manager') {
        checkManagerAuthentication();
    }
}

// Função para mostrar/esconder abas de gestores
function showManagerTab(tabName) {
    // Esconder todas as abas de gestores
    document.querySelectorAll('.manager-tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Remover classe active de todos os botões de gestores
    document.querySelectorAll('.manager-tab-button').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Mostrar aba selecionada
    document.getElementById('manager' + tabName.charAt(0).toUpperCase() + tabName.slice(1) + 'Tab').classList.add('active');
    event.target.classList.add('active');
    
    // Se for a aba de configurações, inicializar os dados
    if (tabName === 'config') {
        initializeConfigurationData();
    }
    
    // Se for a aba de usuários pendentes, inicializar a visualização
    if (tabName === 'users') {
        updatePendingView();
    }
    
    // Se for a aba de dados, inicializar a visualização
    if (tabName === 'data') {
        initializeDataView();
        updateDataView();
    }
    
    // Se for a aba de envios pendentes, atualizar a visualização do gestor
    if (tabName === 'pending') {
        updateManagerView();
    }
}

// Funções para atualizar redes e usuários baseado no estado
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
    
    // Atualizar status de envios
    updateSubmissionStatus();
}

function updateUsersByState() {
    const stateSelect = document.getElementById('state');
    const userSelect = document.getElementById('user');
    const selectedState = stateSelect.value;
    
    userSelect.innerHTML = '<option value="">Selecione um usuário</option>';
    
    if (selectedState && systemConfig.usersByState[selectedState]) {
        systemConfig.usersByState[selectedState].forEach(user => {
            const option = document.createElement('option');
            option.value = user;
            option.textContent = user;
            userSelect.appendChild(option);
        });
    }
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
    
    // Atualizar status de envios
    updateSubmissionStatus();
}

function updateDryUsersByState() {
    const stateSelect = document.getElementById('dryState');
    const userSelect = document.getElementById('dryUser');
    const selectedState = stateSelect.value;
    
    userSelect.innerHTML = '<option value="">Selecione um usuário</option>';
    
    if (selectedState && systemConfig.usersByState[selectedState]) {
        systemConfig.usersByState[selectedState].forEach(user => {
            const option = document.createElement('option');
            option.value = user;
            option.textContent = user;
            userSelect.appendChild(option);
        });
    }
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
    
    // Atualizar status de envios
    updateSubmissionStatus();
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
    
    // Atualizar status de envios
    updateSubmissionStatus();
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
    const selectedState = document.getElementById('state').value;
    const selectedNetwork = document.getElementById('network').value;
    let inventoryHtml = '';
    
    if (selectedState && selectedNetwork) {
        Object.values(submissionStatus.inventory).forEach(submission => {
            if (submission.state === selectedState && submission.network === selectedNetwork) {
                inventoryHtml += `<div class="submission-item">
                    <span class="submitted">✓</span> ${submission.user} da ${submission.network} da ${submission.store} já enviou
                    <small>(${submission.timestamp.toLocaleString()})</small>
                </div>`;
            }
        });
        
        if (inventoryHtml === '') {
            inventoryHtml = '<p>Nenhum envio registrado para esta rede ainda.</p>';
        }
    } else {
        inventoryHtml = '<p>Selecione estado e rede para ver os envios.</p>';
    }
    
    inventoryContainer.innerHTML = inventoryHtml;
    
    // Status das caixas secas
    const dryBoxesContainer = document.getElementById('dryBoxesSubmissions');
    const selectedDryState = document.getElementById('dryState').value;
    const selectedDryNetwork = document.getElementById('dryNetwork').value;
    let dryBoxesHtml = '';
    
    if (selectedDryState && selectedDryNetwork) {
        Object.values(submissionStatus.dryBoxes).forEach(submission => {
            if (submission.state === selectedDryState && submission.network === selectedDryNetwork) {
                dryBoxesHtml += `<div class="submission-item">
                    <span class="submitted">✓</span> ${submission.user} da ${submission.network} da ${submission.store} já enviou
                    <small>(${submission.timestamp.toLocaleString()})</small>
                </div>`;
            }
        });
        
        if (dryBoxesHtml === '') {
            dryBoxesHtml = '<p>Nenhum envio registrado para esta rede ainda.</p>';
        }
    } else {
        dryBoxesHtml = '<p>Selecione estado e rede para ver os envios.</p>';
    }
    
    dryBoxesContainer.innerHTML = dryBoxesHtml;
}

// Função para atualizar visualização do gestor
function updateManagerView() {
    // Exibir dados do inventário
    updateManagerInventoryView();
    updateManagerDryBoxesView();
}

function updateManagerInventoryView() {
    const container = document.getElementById('managerInventoryData');
    let html = '';
    
    Object.values(submissionStatus.inventory).forEach(submission => {
        html += `<div class="manager-submission">
            <strong>${submission.user}</strong> - ${submission.store}
            <div class="submission-details">
                Estado: ${submission.state} | Rede: ${submission.network}
                <br>Enviado em: ${submission.timestamp.toLocaleString()}
            </div>
        </div>`;
    });
    
    if (html === '') {
        html = '<p>Nenhum envio encontrado.</p>';
    }
    
    container.innerHTML = html;
}

function updateManagerDryBoxesView() {
    const container = document.getElementById('managerDryBoxesData');
    let html = '';
    
    Object.values(submissionStatus.dryBoxes).forEach(submission => {
        html += `<div class="manager-submission">
            <strong>${submission.user}</strong> - ${submission.store}
            <div class="submission-details">
                Estado: ${submission.state} | Rede: ${submission.network}
                <br>Enviado em: ${submission.timestamp.toLocaleString()}
            </div>
        </div>`;
    });
    
    if (html === '') {
        html = '<p>Nenhum envio encontrado.</p>';
    }
    
    container.innerHTML = html;
    
    // Atualizar filas de envio
    updateManagerQueueViews();
}

function updateManagerQueueViews() {
    updateManagerInventoryQueue();
    updateManagerDryBoxesQueue();
}

function updateManagerInventoryQueue() {
    const container = document.getElementById('managerInventoryQueue');
    let html = '';
    
    inventorySubmissionQueue.forEach((submission, index) => {
        html += `<div class="queue-item">
            <div class="queue-header">
                <div class="queue-user-info">
                    <strong>${submission.user}</strong> - ${submission.store}
                    <br><small>Estado: ${submission.state} | Rede: ${submission.network}</small>
                    <br><small>Adicionado em: ${submission.timestamp.toLocaleString()}</small>
                </div>
                <div class="queue-actions">
                    <button class="edit-btn" onclick="editQueueSubmission('inventory', ${index})">Editar</button>
                    <button class="send-btn" onclick="sendImmediately('inventory', ${index})">Enviar Agora</button>
                    <button class="delete-btn" onclick="deleteQueueSubmission('inventory', ${index})">Excluir</button>
                </div>
            </div>
            <div class="queue-items-list">
                <strong>Itens (${submission.items.length}):</strong>
                ${submission.items.map(item => 
                    `<div class="queue-item-detail">
                        ${item.productType} - ${item.boxType} (${item.quantity} Caixas)
                    </div>`
                ).join('')}
            </div>
        </div>`;
    });
    
    if (html === '') {
        html = '<p>Nenhum envio pendente de inventário.</p>';
    }
    
    container.innerHTML = html;
}

function updateManagerDryBoxesQueue() {
    const container = document.getElementById('managerDryBoxesQueue');
    let html = '';
    
    dryBoxesSubmissionQueue.forEach((submission, index) => {
        html += `<div class="queue-item">
            <div class="queue-header">
                <div class="queue-user-info">
                    <strong>${submission.user}</strong> - ${submission.store}
                    <br><small>Estado: ${submission.state} | Rede: ${submission.network}</small>
                    <br><small>Adicionado em: ${submission.timestamp.toLocaleString()}</small>
                </div>
                <div class="queue-actions">
                    <button class="edit-btn" onclick="editQueueSubmission('dryBoxes', ${index})">Editar</button>
                    <button class="send-btn" onclick="sendImmediately('dryBoxes', ${index})">Enviar Agora</button>
                    <button class="delete-btn" onclick="deleteQueueSubmission('dryBoxes', ${index})">Excluir</button>
                </div>
            </div>
            <div class="queue-items-list">
                <strong>Itens (${submission.items.length}):</strong>
                ${submission.items.map(item => 
                    `<div class="queue-item-detail">
                        ${item.boxType} (${item.quantity} Caixas)
                    </div>`
                ).join('')}
            </div>
        </div>`;
    });
    
    if (html === '') {
        html = '<p>Nenhum envio pendente de caixas secas.</p>';
    }
    
    container.innerHTML = html;
}

function sendImmediately(type, index) {
    if (confirm('Tem certeza que deseja enviar este item imediatamente para todos os emails cadastrados?')) {
        const queue = type === 'inventory' ? inventorySubmissionQueue : dryBoxesSubmissionQueue;
        const submission = queue[index];
        
        // Filtrar emails que devem receber este tipo de envio
        const relevantEmails = systemConfig.emails.filter(email => {
            if (type === 'inventory') {
                return email.inventory;
            } else {
                return email.dryBoxes;
            }
        });
        
        if (relevantEmails.length === 0) {
            showStatus('Nenhum email configurado para receber este tipo de envio!', 'error');
            return;
        }
        
        // Simular envio do email
        console.log(`Enviando ${type === 'inventory' ? 'inventário' : 'caixas secas'} imediatamente para:`, relevantEmails.map(e => e.address));
        console.log('Dados enviados:', submission);
        
        // Remover da lista de pendentes
        queue.splice(index, 1);
        updateManagerView();
        
        const typeText = type === 'inventory' ? 'inventário' : 'caixas secas';
        showStatus(`${typeText.charAt(0).toUpperCase() + typeText.slice(1)} enviado imediatamente para ${relevantEmails.length} email(s)!`, 'success');
    }
}

function deleteQueueSubmission(type, index) {
    if (confirm('Tem certeza que deseja excluir este envio?')) {
        if (type === 'inventory') {
            inventorySubmissionQueue.splice(index, 1);
        } else {
            dryBoxesSubmissionQueue.splice(index, 1);
        }
        updateManagerView();
        showStatus('Envio excluído com sucesso!', 'success');
    }
}

let currentEditingSubmission = null;

function editQueueSubmission(type, index) {
    currentEditingSubmission = { type, index };
    const submission = type === 'inventory' ? inventorySubmissionQueue[index] : dryBoxesSubmissionQueue[index];
    
    showEditModal(submission, type);
}

function showEditModal(submission, type) {
    const modal = document.getElementById('editModal') || createEditModal();
    const modalContent = modal.querySelector('.modal-content');
    
    const title = type === 'inventory' ? 'Inventário Diário' : 'Caixas Secas';
    
    modalContent.innerHTML = `
        <div class="modal-header">
            <h3>Editar Envio - ${title}</h3>
            <button class="close-modal" onclick="closeEditModal()">Fechar</button>
        </div>
        <div class="modal-body">
            <div class="form-group">
                <label>Usuário: <strong>${submission.user}</strong></label>
            </div>
            <div class="form-group">
                <label>Estado: <strong>${submission.state}</strong></label>
            </div>
            <div class="form-group">
                <label>Rede: <strong>${submission.network}</strong></label>
            </div>
            <div class="form-group">
                <label>Loja: <strong>${submission.store}</strong></label>
            </div>
            <div id="editableItems">
                <h4>Itens:</h4>
                ${generateEditableItems(submission.items, type)}
            </div>
            <button onclick="addNewEditableItem('${type}')">Adicionar Item</button>
        </div>
        <div class="modal-footer" style="text-align: right; margin-top: 20px;">
            <button onclick="closeEditModal()" style="background-color: #6c757d;">Cancelar</button>
            <button onclick="saveEditedSubmission()" style="background-color: #28a745;">Salvar Alterações</button>
        </div>
    `;
    
    modal.style.display = 'block';
}

function generateEditableItems(items, type) {
    return items.map((item, index) => {
        if (type === 'inventory') {
            return `<div class="editable-item" data-index="${index}">
                <button class="item-remove-btn" onclick="removeEditableItem(${index})">Remover</button>
                <div class="form-group">
                    <label>Tipo do Produto:</label>
                    <input type="text" name="productType" value="${item.productType}" required>
                </div>
                <div class="form-group">
                    <label>Tipo de Caixa:</label>
                    <select name="boxType" required>
                        <option value="Pequena" ${item.boxType === 'Pequena' ? 'selected' : ''}>Pequena</option>
                        <option value="Média" ${item.boxType === 'Média' ? 'selected' : ''}>Média</option>
                        <option value="Grande" ${item.boxType === 'Grande' ? 'selected' : ''}>Grande</option>
                        <option value="Extra Grande" ${item.boxType === 'Extra Grande' ? 'selected' : ''}>Extra Grande</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Quantidade:</label>
                    <input type="number" name="quantity" value="${item.quantity}" min="0" required>
                </div>
            </div>`;
        } else {
            return `<div class="editable-item" data-index="${index}">
                <button class="item-remove-btn" onclick="removeEditableItem(${index})">Remover</button>
                <div class="form-group">
                    <label>Tipo de Caixa Seca:</label>
                    <select name="boxType" required>
                        <option value="Caixa Seca Pequena" ${item.boxType === 'Caixa Seca Pequena' ? 'selected' : ''}>Caixa Seca Pequena</option>
                        <option value="Caixa Seca Média" ${item.boxType === 'Caixa Seca Média' ? 'selected' : ''}>Caixa Seca Média</option>
                        <option value="Caixa Seca Grande" ${item.boxType === 'Caixa Seca Grande' ? 'selected' : ''}>Caixa Seca Grande</option>
                        <option value="Caixa Seca Extra Grande" ${item.boxType === 'Caixa Seca Extra Grande' ? 'selected' : ''}>Caixa Seca Extra Grande</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Quantidade:</label>
                    <input type="number" name="quantity" value="${item.quantity}" min="0" required>
                </div>
            </div>`;
        }
    }).join('');
}

function addNewEditableItem(type) {
    const container = document.getElementById('editableItems');
    const itemsCount = container.querySelectorAll('.editable-item').length;
    
    let newItemHtml = '';
    if (type === 'inventory') {
        newItemHtml = `<div class="editable-item" data-index="${itemsCount}">
            <button class="item-remove-btn" onclick="removeEditableItem(${itemsCount})">Remover</button>
            <div class="form-group">
                <label>Tipo do Produto:</label>
                <input type="text" name="productType" required>
            </div>
            <div class="form-group">
                <label>Tipo de Caixa:</label>
                <select name="boxType" required>
                    <option value="">Selecione o tipo de caixa</option>
                    <option value="Pequena">Pequena</option>
                    <option value="Média">Média</option>
                    <option value="Grande">Grande</option>
                    <option value="Extra Grande">Extra Grande</option>
                </select>
            </div>
            <div class="form-group">
                <label>Quantidade:</label>
                <input type="number" name="quantity" min="0" required>
            </div>
        </div>`;
    } else {
        newItemHtml = `<div class="editable-item" data-index="${itemsCount}">
            <button class="item-remove-btn" onclick="removeEditableItem(${itemsCount})">Remover</button>
            <div class="form-group">
                <label>Tipo de Caixa Seca:</label>
                <select name="boxType" required>
                    <option value="">Selecione o tipo de caixa</option>
                    <option value="Caixa Seca Pequena">Caixa Seca Pequena</option>
                    <option value="Caixa Seca Média">Caixa Seca Média</option>
                    <option value="Caixa Seca Grande">Caixa Seca Grande</option>
                    <option value="Caixa Seca Extra Grande">Caixa Seca Extra Grande</option>
                </select>
            </div>
            <div class="form-group">
                <label>Quantidade:</label>
                <input type="number" name="quantity" min="0" required>
            </div>
        </div>`;
    }
    
    container.insertAdjacentHTML('beforeend', newItemHtml);
}

function removeEditableItem(index) {
    const item = document.querySelector(`[data-index="${index}"]`);
    if (item) {
        item.remove();
    }
}

function saveEditedSubmission() {
    if (!currentEditingSubmission) return;
    
    const { type, index } = currentEditingSubmission;
    const editableItems = document.querySelectorAll('.editable-item');
    
    const updatedItems = [];
    editableItems.forEach(itemDiv => {
        const inputs = itemDiv.querySelectorAll('input, select');
        const item = {};
        
        inputs.forEach(input => {
            if (input.name === 'quantity') {
                item[input.name] = parseInt(input.value);
            } else {
                item[input.name] = input.value;
            }
        });
        
        updatedItems.push(item);
    });
    
    if (updatedItems.length === 0) {
        alert('Pelo menos um item deve ser mantido.');
        return;
    }
    
    // Atualizar a submission
    const queue = type === 'inventory' ? inventorySubmissionQueue : dryBoxesSubmissionQueue;
    queue[index].items = updatedItems;
    
    closeEditModal();
    updateManagerView();
    showStatus('Envio atualizado com sucesso!', 'success');
}

function createEditModal() {
    const modal = document.createElement('div');
    modal.id = 'editModal';
    modal.className = 'modal';
    modal.innerHTML = '<div class="modal-content"></div>';
    
    // Fechar modal clicando fora
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeEditModal();
        }
    });
    
    document.body.appendChild(modal);
    return modal;
}

function closeEditModal() {
    const modal = document.getElementById('editModal');
    if (modal) {
        modal.style.display = 'none';
    }
    currentEditingSubmission = null;
}

// Funções de contagem regressiva
function updateCountdowns() {
    updateInventoryCountdown();
    updateDryBoxesCountdown();
}

function updateInventoryCountdown() {
    const now = new Date();
    const [hours, minutes] = systemConfig.inventoryTime.split(':').map(Number);
    
    // Encontrar próximo dia configurado
    const currentDay = now.getDay();
    let nextTargetDay = null;
    let daysUntilTarget = 7; // Máximo de uma semana
    
    // Verificar se hoje é um dia configurado e ainda não passou do horário
    if (systemConfig.inventoryDays.includes(currentDay)) {
        const todayTarget = new Date(now);
        todayTarget.setHours(hours, minutes, 0, 0);
        
        if (now.getTime() < todayTarget.getTime()) {
            nextTargetDay = currentDay;
            daysUntilTarget = 0;
        }
    }
    
    // Se não encontrou hoje, procurar próximo dia
    if (nextTargetDay === null) {
        for (let i = 1; i <= 7; i++) {
            const checkDay = (currentDay + i) % 7;
            if (systemConfig.inventoryDays.includes(checkDay)) {
                nextTargetDay = checkDay;
                daysUntilTarget = i;
                break;
            }
        }
    }
    
    const target = new Date(now);
    target.setDate(now.getDate() + daysUntilTarget);
    target.setHours(hours, minutes, 0, 0);
    
    const timeDiff = target - now;
    const remainingHours = Math.floor(timeDiff / (1000 * 60 * 60));
    const remainingMinutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
    const remainingSeconds = Math.floor((timeDiff % (1000 * 60)) / 1000);
    
    const countdownElement = document.getElementById('inventoryCountdown');
    countdownElement.innerHTML = `${remainingHours.toString().padStart(2, '0')}:${remainingMinutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}

function updateDryBoxesCountdown() {
    const now = new Date();
    const [hours, minutes] = systemConfig.dryBoxesTime.split(':').map(Number);
    
    // Encontrar próximo dia configurado
    const currentDay = now.getDay();
    let nextTargetDay = null;
    let daysUntilTarget = 7; // Máximo de uma semana
    
    // Verificar se hoje é um dia configurado e ainda não passou do horário
    if (systemConfig.dryBoxesDays.includes(currentDay)) {
        const todayTarget = new Date(now);
        todayTarget.setHours(hours, minutes, 0, 0);
        
        if (now.getTime() < todayTarget.getTime()) {
            nextTargetDay = currentDay;
            daysUntilTarget = 0;
        }
    }
    
    // Se não encontrou hoje, procurar próximo dia
    if (nextTargetDay === null) {
        for (let i = 1; i <= 7; i++) {
            const checkDay = (currentDay + i) % 7;
            if (systemConfig.dryBoxesDays.includes(checkDay)) {
                nextTargetDay = checkDay;
                daysUntilTarget = i;
                break;
            }
        }
    }
    
    const target = new Date(now);
    target.setDate(now.getDate() + daysUntilTarget);
    target.setHours(hours, minutes, 0, 0);
    
    const timeDiff = target - now;
    const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
    const remainingHours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const remainingMinutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
    const remainingSeconds = Math.floor((timeDiff % (1000 * 60)) / 1000);
    
    const countdownElement = document.getElementById('dryBoxesCountdown');
    countdownElement.innerHTML = `${days}d ${remainingHours.toString().padStart(2, '0')}:${remainingMinutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}

// Função para envio automático
function processAutomaticSubmissions() {
    const now = new Date();
    const [inventoryHours, inventoryMinutes] = systemConfig.inventoryTime.split(':').map(Number);
    const [dryBoxesHours, dryBoxesMinutes] = systemConfig.dryBoxesTime.split(':').map(Number);
    const currentDay = now.getDay();
    
    // Verificar envio de inventário (dias e horário configurados)
    if (systemConfig.inventoryDays.includes(currentDay) && 
        now.getHours() === inventoryHours && 
        now.getMinutes() === inventoryMinutes) {
        if (inventorySubmissionQueue.length > 0) {
            console.log('Enviando inventários automaticamente para:', systemConfig.emails);
            console.log('Dados do inventário:', inventorySubmissionQueue);
            inventorySubmissionQueue = [];
            showStatus('Inventários enviados automaticamente!', 'success');
        }
    }
    
    // Verificar envio de caixas secas (dias e horário configurados)
    if (systemConfig.dryBoxesDays.includes(currentDay) && 
        now.getHours() === dryBoxesHours && 
        now.getMinutes() === dryBoxesMinutes) {
        if (dryBoxesSubmissionQueue.length > 0) {
            console.log('Enviando caixas secas automaticamente para:', systemConfig.emails);
            console.log('Dados das caixas secas:', dryBoxesSubmissionQueue);
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

// Funções de autenticação do gestor
function checkManagerAuthentication() {
    const loginDiv = document.getElementById('managerLogin');
    const managerArea = document.getElementById('managerArea');
    
    if (managerAuthenticated) {
        loginDiv.style.display = 'none';
        managerArea.style.display = 'block';
        updateManagerView();
    } else {
        loginDiv.style.display = 'block';
        managerArea.style.display = 'none';
    }
}

function authenticateManager(password) {
    if (password === MANAGER_PASSWORD) {
        managerAuthenticated = true;
        document.getElementById('loginError').style.display = 'none';
        checkManagerAuthentication();
        showStatus('Login realizado com sucesso!', 'success');
        return true;
    } else {
        document.getElementById('loginError').style.display = 'block';
        showStatus('Senha incorreta!', 'error');
        return false;
    }
}

function logoutManager() {
    managerAuthenticated = false;
    document.getElementById('managerPassword').value = '';
    document.getElementById('loginError').style.display = 'none';
    checkManagerAuthentication();
    showStatus('Logout realizado com sucesso!', 'success');
}

// Event listeners para login/logout
document.getElementById('managerLoginForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const password = document.getElementById('managerPassword').value;
    authenticateManager(password);
});

document.getElementById('logoutManager').addEventListener('click', function() {
    logoutManager();
});

// Funções de configuração
function initializeConfigurationData() {
    // Inicializar horários
    document.getElementById('inventoryTime').value = systemConfig.inventoryTime;
    document.getElementById('dryBoxesTime').value = systemConfig.dryBoxesTime;
    
    // Inicializar dias do inventário
    for (let i = 0; i <= 6; i++) {
        const checkbox = document.getElementById(`inventoryDay${i}`);
        if (checkbox) {
            checkbox.checked = systemConfig.inventoryDays.includes(i);
        }
    }
    
    // Inicializar dias das caixas secas
    for (let i = 0; i <= 6; i++) {
        const checkbox = document.getElementById(`dryBoxesDay${i}`);
        if (checkbox) {
            checkbox.checked = systemConfig.dryBoxesDays.includes(i);
        }
    }
    
    // Iniciar com listas escondidas
    hideAllUsers();
    hideAllStates();
    hideAllNetworks();
    hideAllStores();
    updateEmailsList();
    updateConfigSelects();
}

function updateConfigSelects() {
    // Atualizar select de estados para novo usuário
    const newUserStateSelect = document.getElementById('newUserState');
    if (newUserStateSelect) {
        newUserStateSelect.innerHTML = '<option value="">Selecione um estado</option>';
        Object.keys(networksByState).forEach(state => {
            const option = document.createElement('option');
            option.value = state;
            option.textContent = state;
            newUserStateSelect.appendChild(option);
        });
    }
    
    // Atualizar select de estados para filtro de usuários
    const userStateSelect = document.getElementById('userState');
    if (userStateSelect) {
        userStateSelect.innerHTML = '<option value="">Todos os estados</option>';
        Object.keys(networksByState).forEach(state => {
            const option = document.createElement('option');
            option.value = state;
            option.textContent = state;
            userStateSelect.appendChild(option);
        });
    }
    
    // Atualizar select de estados para redes
    const networkStateSelect = document.getElementById('networkState');
    networkStateSelect.innerHTML = '<option value="">Selecione um estado</option>';
    Object.keys(networksByState).forEach(state => {
        const option = document.createElement('option');
        option.value = state;
        option.textContent = state;
        networkStateSelect.appendChild(option);
    });
    
    // Atualizar select de redes para lojas
    const storeNetworkSelect = document.getElementById('storeNetwork');
    storeNetworkSelect.innerHTML = '<option value="">Selecione uma rede</option>';
    Object.keys(storesByNetwork).forEach(network => {
        const option = document.createElement('option');
        option.value = network;
        option.textContent = network;
        storeNetworkSelect.appendChild(option);
    });
}

function saveScheduleSettings() {
    systemConfig.inventoryTime = document.getElementById('inventoryTime').value;
    systemConfig.dryBoxesTime = document.getElementById('dryBoxesTime').value;
    
    // Coletar dias selecionados para inventário
    systemConfig.inventoryDays = [];
    for (let i = 0; i <= 6; i++) {
        const checkbox = document.getElementById(`inventoryDay${i}`);
        if (checkbox && checkbox.checked) {
            systemConfig.inventoryDays.push(i);
        }
    }
    
    // Coletar dias selecionados para caixas secas
    systemConfig.dryBoxesDays = [];
    for (let i = 0; i <= 6; i++) {
        const checkbox = document.getElementById(`dryBoxesDay${i}`);
        if (checkbox && checkbox.checked) {
            systemConfig.dryBoxesDays.push(i);
        }
    }
    
    if (systemConfig.inventoryDays.length === 0) {
        showStatus('Selecione pelo menos um dia para o inventário!', 'error');
        return;
    }
    
    if (systemConfig.dryBoxesDays.length === 0) {
        showStatus('Selecione pelo menos um dia para as caixas secas!', 'error');
        return;
    }
    
    showStatus('Configurações de horário salvas com sucesso!', 'success');
}

// Gerenciar usuários
function addUser() {
    const selectedState = document.getElementById('newUserState').value;
    const newUser = document.getElementById('newUser').value.trim();
    
    if (!selectedState) {
        showStatus('Selecione um estado primeiro!', 'error');
        return;
    }
    
    if (!newUser) {
        showStatus('Digite um nome válido!', 'error');
        return;
    }
    
    // Verificar se usuário já existe no estado
    if (systemConfig.usersByState[selectedState] && systemConfig.usersByState[selectedState].includes(newUser)) {
        showStatus('Usuário já existe neste estado!', 'error');
        return;
    }
    
    // Verificar se usuário já existe em outro estado
    for (const state in systemConfig.usersByState) {
        if (systemConfig.usersByState[state].includes(newUser)) {
            showStatus(`Usuário já existe no estado: ${state}!`, 'error');
            return;
        }
    }
    
    if (!systemConfig.usersByState[selectedState]) {
        systemConfig.usersByState[selectedState] = [];
    }
    
    systemConfig.usersByState[selectedState].push(newUser);
    updateUsersList();
    updateUserSelects();
    document.getElementById('newUser').value = '';
    document.getElementById('newUserState').value = '';
    showStatus('Usuário adicionado com sucesso!', 'success');
}

function removeUser(username, state) {
    if (confirm(`Tem certeza que deseja remover o usuário "${username}" do estado "${state}"?`)) {
        if (systemConfig.usersByState[state]) {
            systemConfig.usersByState[state] = systemConfig.usersByState[state].filter(user => user !== username);
        }
        updateUsersList();
        updateUserSelects();
        showStatus('Usuário removido com sucesso!', 'success');
    }
}

function updateUsersList() {
    const container = document.getElementById('usersList');
    let html = '';
    
    Object.keys(systemConfig.usersByState).forEach(state => {
        if (systemConfig.usersByState[state].length > 0) {
            html += `
                <div class="list-item state-header">
                    <span>${state}</span>
                </div>
            `;
            
            systemConfig.usersByState[state].forEach(user => {
                html += `
                    <div class="list-item network-item">
                        <label class="item-checkbox">
                            <input type="checkbox" data-username="${user}" data-state="${state}">
                            <span>${user}</span>
                        </label>
                        <button onclick="removeUser('${user}', '${state}')">Remover</button>
                    </div>
                `;
            });
        }
    });
    
    if (html === '') {
        html = '<p>Nenhum usuário cadastrado ainda.</p>';
    }
    
    container.innerHTML = html;
}

function updateUserSelects() {
    // Atualizar select de usuários baseado no estado selecionado
    const stateSelect = document.getElementById('state');
    const dryStateSelect = document.getElementById('dryState');
    
    if (stateSelect && stateSelect.value) {
        updateUsersByState();
    }
    
    if (dryStateSelect && dryStateSelect.value) {
        updateDryUsersByState();
    }
}

// Gerenciar estados
function addState() {
    const newState = document.getElementById('newState').value.trim();
    if (newState && !networksByState[newState]) {
        networksByState[newState] = [];
        updateStatesList();
        document.getElementById('newState').value = '';
        showStatus('Estado adicionado com sucesso!', 'success');
    } else if (networksByState[newState]) {
        showStatus('Estado já existe!', 'error');
    } else {
        showStatus('Digite um nome válido!', 'error');
    }
}

function removeState(stateName) {
    if (confirm(`Tem certeza que deseja remover o estado "${stateName}" e todas suas redes?`)) {
        // Remover todas as redes associadas ao estado
        if (networksByState[stateName]) {
            networksByState[stateName].forEach(network => {
                delete storesByNetwork[network];
            });
        }
        
        delete networksByState[stateName];
        updateStatesList();
        showStatus('Estado removido com sucesso!', 'success');
    }
}

function updateStatesList() {
    const container = document.getElementById('statesList');
    let html = '';
    
    Object.keys(networksByState).forEach(state => {
        html += `
            <div class="list-item state-header">
                <label class="item-checkbox">
                    <input type="checkbox" data-state="${state}">
                    <span>${state}</span>
                </label>
                <button onclick="removeState('${state}')">Remover</button>
            </div>
        `;
    });
    
    container.innerHTML = html;
    
    // Atualizar selects de estados nos formulários principais
    updateStateSelects();
}

function updateStateSelects() {
    const stateSelects = ['state', 'dryState', 'managerState'];
    stateSelects.forEach(selectId => {
        const select = document.getElementById(selectId);
        if (select) {
            const currentValue = select.value;
            select.innerHTML = '<option value="">Selecione um estado</option>';
            
            Object.keys(networksByState).forEach(state => {
                const option = document.createElement('option');
                option.value = state;
                option.textContent = state;
                if (state === currentValue) option.selected = true;
                select.appendChild(option);
            });
        }
    });
}

// Gerenciar redes
function addNetwork() {
    const selectedState = document.getElementById('networkState').value;
    const newNetwork = document.getElementById('newNetwork').value.trim();
    
    if (!selectedState) {
        showStatus('Selecione um estado primeiro!', 'error');
        return;
    }
    
    if (!networksByState[selectedState]) {
        showStatus('Estado selecionado não existe!', 'error');
        return;
    }
    
    if (newNetwork && !networksByState[selectedState].includes(newNetwork)) {
        networksByState[selectedState].push(newNetwork);
        storesByNetwork[newNetwork] = [];
        updateNetworksList();
        document.getElementById('newNetwork').value = '';
        showStatus('Rede adicionada com sucesso!', 'success');
    } else if (networksByState[selectedState].includes(newNetwork)) {
        showStatus('Rede já existe neste estado!', 'error');
    } else {
        showStatus('Digite um nome válido!', 'error');
    }
}

function removeNetwork(networkName) {
    if (confirm(`Tem certeza que deseja remover a rede "${networkName}" e todas suas lojas?`)) {
        // Remover das redes por estado
        Object.keys(networksByState).forEach(state => {
            networksByState[state] = networksByState[state].filter(network => network !== networkName);
        });
        
        // Remover das lojas por rede
        delete storesByNetwork[networkName];
        
        updateNetworksList();
        updateConfigSelects();
        showStatus('Rede removida com sucesso!', 'success');
    }
}

function updateNetworksList() {
    const container = document.getElementById('networksList');
    let html = '';
    
    Object.keys(networksByState).forEach(state => {
        if (networksByState[state].length > 0) {
            html += `
                <div class="list-item state-header">
                    <span>${state}</span>
                </div>
            `;
            
            networksByState[state].forEach(network => {
                html += `
                    <div class="list-item network-item">
                        <label class="item-checkbox">
                            <input type="checkbox" data-network="${network}">
                            <span>${network}</span>
                        </label>
                        <button onclick="removeNetwork('${network}')">Remover</button>
                    </div>
                `;
            });
        }
    });
    
    container.innerHTML = html;
    updateConfigSelects();
}

// Gerenciar lojas
function addStore() {
    const selectedNetwork = document.getElementById('storeNetwork').value;
    const newStore = document.getElementById('newStore').value.trim();
    
    if (!selectedNetwork) {
        showStatus('Selecione uma rede primeiro!', 'error');
        return;
    }
    
    if (!storesByNetwork[selectedNetwork]) {
        showStatus('Rede selecionada não existe!', 'error');
        return;
    }
    
    if (newStore && !storesByNetwork[selectedNetwork].includes(newStore)) {
        storesByNetwork[selectedNetwork].push(newStore);
        updateStoresList();
        document.getElementById('newStore').value = '';
        showStatus('Loja adicionada com sucesso!', 'success');
    } else if (storesByNetwork[selectedNetwork].includes(newStore)) {
        showStatus('Loja já existe nesta rede!', 'error');
    } else {
        showStatus('Digite um nome válido!', 'error');
    }
}

function removeStore(storeName) {
    if (confirm(`Tem certeza que deseja remover a loja "${storeName}"?`)) {
        Object.keys(storesByNetwork).forEach(network => {
            storesByNetwork[network] = storesByNetwork[network].filter(store => store !== storeName);
        });
        
        updateStoresList();
        showStatus('Loja removida com sucesso!', 'success');
    }
}

function updateStoresList() {
    const container = document.getElementById('storesList');
    let html = '';
    
    Object.keys(storesByNetwork).forEach(network => {
        if (storesByNetwork[network].length > 0) {
            html += `
                <div class="list-item network-header">
                    <span>${network}</span>
                </div>
            `;
            
            storesByNetwork[network].forEach(store => {
                html += `
                    <div class="list-item store-item">
                        <label class="item-checkbox">
                            <input type="checkbox" data-store="${store}">
                            <span>${store}</span>
                        </label>
                        <button onclick="removeStore('${store}')">Remover</button>
                    </div>
                `;
            });
        }
    });
    
    container.innerHTML = html;
    updateStoreSelects();
}

function updateStoreSelects() {
    const storeSelects = ['store', 'dryStore'];
    storeSelects.forEach(selectId => {
        const select = document.getElementById(selectId);
        if (select) {
            const currentValue = select.value;
            const currentNetwork = selectId === 'store' ? 
                document.getElementById('network').value : 
                document.getElementById('dryNetwork').value;
                
            select.innerHTML = '<option value="">Selecione uma loja</option>';
            
            if (currentNetwork && storesByNetwork[currentNetwork]) {
                storesByNetwork[currentNetwork].forEach(store => {
                    const option = document.createElement('option');
                    option.value = store;
                    option.textContent = store;
                    if (store === currentValue) option.selected = true;
                    select.appendChild(option);
                });
            }
        }
    });
}

// Gerenciar emails
function addEmail() {
    const newEmail = document.getElementById('newEmail').value.trim();
    const emailExists = systemConfig.emails.some(email => email.address === newEmail);
    
    // Validar formato do email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!newEmail) {
        showStatus('Digite um email!', 'error');
        return;
    }
    
    if (!emailRegex.test(newEmail)) {
        showStatus('Formato de email inválido!', 'error');
        return;
    }
    
    if (emailExists) {
        showStatus('Email já existe!', 'error');
        return;
    }
    
    systemConfig.emails.push({
        address: newEmail,
        inventory: true,
        dryBoxes: true
    });
    updateEmailsList();
    document.getElementById('newEmail').value = '';
    showStatus('Email adicionado com sucesso!', 'success');
}

function removeEmail(emailAddress) {
    if (confirm(`Tem certeza que deseja remover o email "${emailAddress}"?`)) {
        systemConfig.emails = systemConfig.emails.filter(e => e.address !== emailAddress);
        updateEmailsList();
        showStatus('Email removido com sucesso!', 'success');
    }
}

function updateEmailsList() {
    const container = document.getElementById('emailsList');
    let html = '';
    
    systemConfig.emails.forEach((email, index) => {
        html += `
            <div class="email-item">
                <div class="email-info">
                    <label class="item-checkbox">
                        <input type="checkbox" data-email="${email.address}">
                        <span class="email-address">${email.address}</span>
                    </label>
                    <div class="email-options">
                        <label class="email-checkbox">
                            <input type="checkbox" ${email.inventory ? 'checked' : ''} 
                                   onchange="updateEmailSetting(${index}, 'inventory', this.checked)">
                            Inventário
                        </label>
                        <label class="email-checkbox">
                            <input type="checkbox" ${email.dryBoxes ? 'checked' : ''} 
                                   onchange="updateEmailSetting(${index}, 'dryBoxes', this.checked)">
                            Caixas Secas
                        </label>
                        <label class="email-checkbox">
                            <input type="checkbox" ${email.inventory && email.dryBoxes ? 'checked' : ''} 
                                   onchange="updateEmailSetting(${index}, 'all', this.checked)">
                            Tudo
                        </label>
                    </div>
                </div>
                <button onclick="removeEmail('${email.address}')">Remover</button>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

function updateEmailSetting(index, setting, checked) {
    if (setting === 'all') {
        systemConfig.emails[index].inventory = checked;
        systemConfig.emails[index].dryBoxes = checked;
    } else {
        systemConfig.emails[index][setting] = checked;
    }
    
    // Se desmarcar inventário ou caixas secas, desmarcar "tudo" também
    if (!checked && setting !== 'all') {
        const email = systemConfig.emails[index];
        if (!email.inventory || !email.dryBoxes) {
            // Atualizar a visualização
            updateEmailsList();
            return;
        }
    }
    
    updateEmailsList();
    showStatus('Configuração de email atualizada!', 'success');
}

// Funções de busca para usuários
function searchUsers() {
    const searchTerm = document.getElementById('searchUser').value.toLowerCase();
    const container = document.getElementById('usersList');
    
    if (searchTerm === '') {
        updateUsersList();
        return;
    }
    
    let html = '';
    let foundAny = false;
    
    Object.keys(systemConfig.usersByState).forEach(state => {
        const filteredUsers = systemConfig.usersByState[state].filter(user => 
            user.toLowerCase().includes(searchTerm)
        );
        
        if (filteredUsers.length > 0) {
            foundAny = true;
            html += `
                <div class="list-item state-header">
                    <span>${state}</span>
                </div>
            `;
            
            filteredUsers.forEach(user => {
                html += `
                    <div class="list-item network-item">
                        <span>${user}</span>
                        <button onclick="removeUser('${user}', '${state}')">Remover</button>
                    </div>
                `;
            });
        }
    });
    
    if (!foundAny) {
        html = '<p>Nenhum usuário encontrado.</p>';
    }
    
    container.innerHTML = html;
}

function showAllUsers() {
    document.getElementById('searchUser').value = '';
    updateUsersList();
}

// Funções de busca para estados
function searchStates() {
    const searchTerm = document.getElementById('searchState').value.toLowerCase();
    const container = document.getElementById('statesList');
    
    if (searchTerm === '') {
        updateStatesList();
        return;
    }
    
    const filteredStates = Object.keys(networksByState).filter(state => 
        state.toLowerCase().includes(searchTerm)
    );
    
    let html = '';
    filteredStates.forEach(state => {
        html += `
            <div class="list-item state-header">
                <span>${state}</span>
                <button onclick="removeState('${state}')">Remover</button>
            </div>
        `;
    });
    
    if (html === '') {
        html = '<p>Nenhum estado encontrado.</p>';
    }
    
    container.innerHTML = html;
}

function showAllStates() {
    document.getElementById('searchState').value = '';
    updateStatesList();
}

// Funções de busca para redes
function searchNetworks() {
    const searchTerm = document.getElementById('searchNetwork').value.toLowerCase();
    const container = document.getElementById('networksList');
    
    if (searchTerm === '') {
        updateNetworksList();
        return;
    }
    
    let html = '';
    let foundAny = false;
    
    Object.keys(networksByState).forEach(state => {
        const filteredNetworks = networksByState[state].filter(network => 
            network.toLowerCase().includes(searchTerm)
        );
        
        if (filteredNetworks.length > 0) {
            foundAny = true;
            html += `
                <div class="list-item state-header">
                    <span>${state}</span>
                </div>
            `;
            
            filteredNetworks.forEach(network => {
                html += `
                    <div class="list-item network-item">
                        <span>${network}</span>
                        <button onclick="removeNetwork('${network}')">Remover</button>
                    </div>
                `;
            });
        }
    });
    
    if (!foundAny) {
        html = '<p>Nenhuma rede encontrada.</p>';
    }
    
    container.innerHTML = html;
}

function showAllNetworks() {
    document.getElementById('searchNetwork').value = '';
    updateNetworksList();
}

// Funções de busca para lojas
function searchStores() {
    const searchTerm = document.getElementById('searchStore').value.toLowerCase();
    const container = document.getElementById('storesList');
    
    if (searchTerm === '') {
        updateStoresList();
        return;
    }
    
    let html = '';
    let foundAny = false;
    
    Object.keys(storesByNetwork).forEach(network => {
        const filteredStores = storesByNetwork[network].filter(store => 
            store.toLowerCase().includes(searchTerm)
        );
        
        if (filteredStores.length > 0) {
            foundAny = true;
            html += `
                <div class="list-item network-header">
                    <span>${network}</span>
                </div>
            `;
            
            filteredStores.forEach(store => {
                html += `
                    <div class="list-item store-item">
                        <span>${store}</span>
                        <button onclick="removeStore('${store}')">Remover</button>
                    </div>
                `;
            });
        }
    });
    
    if (!foundAny) {
        html = '<p>Nenhuma loja encontrada.</p>';
    }
    
    container.innerHTML = html;
}

function showAllStores() {
    document.getElementById('searchStore').value = '';
    updateStoresList();
}

// Funções para usuários pendentes
function updatePendingView() {
    pendingViewState = { level: 'states', selectedState: null, selectedNetwork: null };
    showPendingStates();
}

function showPendingStates() {
    const type = document.getElementById('pendingType').value;
    
    // Resetar navegação
    pendingViewState = { level: 'states', selectedState: null, selectedNetwork: null };
    document.getElementById('backToPendingStates').style.display = 'none';
    document.getElementById('backToPendingNetworks').style.display = 'none';
    
    // Mostrar apenas a view de estados
    document.getElementById('pendingStatesView').style.display = 'block';
    document.getElementById('pendingNetworksView').style.display = 'none';
    document.getElementById('pendingUsersView').style.display = 'none';
    
    const container = document.getElementById('pendingStatesList');
    let html = '';
    
    Object.keys(networksByState).forEach(state => {
        const pendingCount = getPendingUsersCountByState(state, type);
        if (pendingCount > 0) {
            html += `
                <div class="pending-item" onclick="showPendingNetworks('${state}')">
                    <span class="pending-name">${state}</span>
                    <span class="pending-count">${pendingCount} usuários ainda não enviaram</span>
                    <span class="pending-arrow">→</span>
                </div>
            `;
        }
    });
    
    if (html === '') {
        html = '<p>Todos os usuários já enviaram!</p>';
    }
    
    container.innerHTML = html;
}

function showPendingNetworks(stateName) {
    if (typeof stateName === 'undefined' && pendingViewState.selectedState) {
        stateName = pendingViewState.selectedState;
    }
    
    const type = document.getElementById('pendingType').value;
    
    pendingViewState.level = 'networks';
    pendingViewState.selectedState = stateName;
    
    // Atualizar navegação
    document.getElementById('backToPendingStates').style.display = 'inline-block';
    document.getElementById('backToPendingNetworks').style.display = 'none';
    
    // Mostrar apenas a view de redes
    document.getElementById('pendingStatesView').style.display = 'none';
    document.getElementById('pendingNetworksView').style.display = 'block';
    document.getElementById('pendingUsersView').style.display = 'none';
    
    document.getElementById('pendingNetworksTitle').textContent = `Redes em ${stateName}`;
    
    const container = document.getElementById('pendingNetworksList');
    let html = '';
    
    if (networksByState[stateName]) {
        networksByState[stateName].forEach(network => {
            const pendingCount = getPendingUsersCountByNetwork(stateName, network, type);
            if (pendingCount > 0) {
                html += `
                    <div class="pending-item" onclick="showPendingUsers('${stateName}', '${network}')">
                        <span class="pending-name">${network}</span>
                        <span class="pending-count">${pendingCount} usuários ainda não enviaram</span>
                        <span class="pending-arrow">→</span>
                    </div>
                `;
            }
        });
    }
    
    if (html === '') {
        html = '<p>Todos os usuários desta rede já enviaram!</p>';
    }
    
    container.innerHTML = html;
}

function showPendingNetworksOriginal(stateName) {
    const type = document.getElementById('pendingType').value;
    
    pendingViewState.level = 'networks';
    pendingViewState.selectedState = stateName;
    
    // Atualizar navegação
    document.getElementById('backToPendingStates').style.display = 'inline-block';
    document.getElementById('backToPendingNetworks').style.display = 'none';
    
    // Mostrar apenas a view de redes
    document.getElementById('pendingStatesView').style.display = 'none';
    document.getElementById('pendingNetworksView').style.display = 'block';
    document.getElementById('pendingUsersView').style.display = 'none';
    
    document.getElementById('pendingNetworksTitle').textContent = `Redes em ${stateName}`;
    
    const container = document.getElementById('pendingNetworksList');
    let html = '';
    
    if (networksByState[stateName]) {
        networksByState[stateName].forEach(network => {
            const pendingCount = getPendingUsersCountByNetwork(stateName, network, type);
            if (pendingCount > 0) {
                html += `
                    <div class="pending-item" onclick="showPendingUsers('${stateName}', '${network}')">
                        <span class="pending-name">${network}</span>
                        <span class="pending-count">${pendingCount} usuários ainda não enviaram</span>
                        <span class="pending-arrow">→</span>
                    </div>
                `;
            }
        });
    }
    
    if (html === '') {
        html = '<p>Todos os usuários desta rede já enviaram!</p>';
    }
    
    container.innerHTML = html;
}

function showPendingUsers(stateName, networkName) {
    const type = document.getElementById('pendingType').value;
    
    pendingViewState.level = 'users';
    pendingViewState.selectedState = stateName;
    pendingViewState.selectedNetwork = networkName;
    
    // Atualizar navegação
    document.getElementById('backToPendingStates').style.display = 'inline-block';
    document.getElementById('backToPendingNetworks').style.display = 'inline-block';
    
    // Mostrar apenas a view de usuários
    document.getElementById('pendingStatesView').style.display = 'none';
    document.getElementById('pendingNetworksView').style.display = 'none';
    document.getElementById('pendingUsersView').style.display = 'block';
    
    document.getElementById('pendingUsersTitle').textContent = `Usuários pendentes em ${networkName} - ${stateName}`;
    
    const container = document.getElementById('pendingUsersList');
    const pendingUsers = getPendingUsersByNetwork(stateName, networkName, type);
    
    let html = '';
    
    if (pendingUsers.length > 0) {
        pendingUsers.forEach(user => {
            html += `
                <div class="pending-user-item">
                    <span class="pending-user-name">${user}</span>
                    <span class="pending-user-status">Não enviou</span>
                </div>
            `;
        });
    } else {
        html = '<p>Todos os usuários desta rede já enviaram!</p>';
    }
    
    container.innerHTML = html;
}

function getPendingUsersCountByState(state, type) {
    const submittedUsers = new Set();
    const submissions = type === 'inventory' ? submissionStatus.inventory : submissionStatus.dryBoxes;
    
    Object.values(submissions).forEach(submission => {
        if (submission.state === state) {
            submittedUsers.add(submission.user);
        }
    });
    
    // Contar usuários do estado que poderiam enviar
    const usersInState = systemConfig.usersByState[state] ? systemConfig.usersByState[state].length : 0;
    let totalUsersInState = 0;
    if (networksByState[state]) {
        networksByState[state].forEach(network => {
            if (storesByNetwork[network]) {
                totalUsersInState += usersInState * storesByNetwork[network].length;
            }
        });
    }
    
    return Math.max(0, totalUsersInState - submittedUsers.size);
}

function getPendingUsersCountByNetwork(state, network, type) {
    const submittedUsers = new Set();
    const submissions = type === 'inventory' ? submissionStatus.inventory : submissionStatus.dryBoxes;
    
    Object.values(submissions).forEach(submission => {
        if (submission.state === state && submission.network === network) {
            submittedUsers.add(submission.user);
        }
    });
    
    // Contar usuários do estado que poderiam enviar nesta rede
    const usersInState = systemConfig.usersByState[state] ? systemConfig.usersByState[state].length : 0;
    const storesCount = storesByNetwork[network] ? storesByNetwork[network].length : 0;
    const totalUsersInNetwork = usersInState * storesCount;
    
    return Math.max(0, totalUsersInNetwork - submittedUsers.size);
}

function getPendingUsersByNetwork(state, network, type) {
    const submittedUsers = new Set();
    const submissions = type === 'inventory' ? submissionStatus.inventory : submissionStatus.dryBoxes;
    
    Object.values(submissions).forEach(submission => {
        if (submission.state === state && submission.network === network) {
            submittedUsers.add(submission.user);
        }
    });
    
    // Retornar usuários do estado que ainda não enviaram
    const usersInState = systemConfig.usersByState[state] || [];
    return usersInState.filter(user => !submittedUsers.has(user));
}

// Funções para visualização de dados organizados
function initializeDataView() {
    // Inicializar select de estados para dados
    const dataStateSelect = document.getElementById('dataState');
    if (dataStateSelect) {
        dataStateSelect.innerHTML = '<option value="">Todos os estados</option>';
        Object.keys(networksByState).forEach(state => {
            const option = document.createElement('option');
            option.value = state;
            option.textContent = state;
            dataStateSelect.appendChild(option);
        });
    }
}

function updateDataNetworks() {
    const stateSelect = document.getElementById('dataState');
    const networkSelect = document.getElementById('dataNetwork');
    const selectedState = stateSelect.value;
    
    networkSelect.innerHTML = '<option value="">Todas as redes</option>';
    
    if (selectedState && networksByState[selectedState]) {
        networksByState[selectedState].forEach(network => {
            const option = document.createElement('option');
            option.value = network;
            option.textContent = network;
            networkSelect.appendChild(option);
        });
    }
}

function updateDataView() {
    dataViewState = { level: 'states', selectedState: null, selectedNetwork: null };
    showDataStates();
}

function showDataStates() {
    const type = document.getElementById('dataType').value;
    const stateFilter = document.getElementById('dataState').value;
    const networkFilter = document.getElementById('dataNetwork').value;
    
    // Resetar navegação
    dataViewState = { level: 'states', selectedState: null, selectedNetwork: null };
    document.getElementById('backToDataStates').style.display = 'none';
    document.getElementById('backToDataNetworks').style.display = 'none';
    
    // Mostrar apenas a view de estados
    document.getElementById('dataStatesView').style.display = 'block';
    document.getElementById('dataNetworksView').style.display = 'none';
    document.getElementById('dataDetailsView').style.display = 'none';
    
    const container = document.getElementById('dataStatesList');
    let html = '';
    
    const submissions = type === 'inventory' ? submissionStatus.inventory : submissionStatus.dryBoxes;
    const statesWithData = new Set();
    
    Object.values(submissions).forEach(submission => {
        if (!stateFilter || submission.state === stateFilter) {
            if (!networkFilter || submission.network === networkFilter) {
                statesWithData.add(submission.state);
            }
        }
    });
    
    statesWithData.forEach(state => {
        const itemCount = getDataItemsCountByState(state, type, stateFilter, networkFilter);
        html += `
            <div class="pending-item" onclick="showDataNetworks('${state}')">
                <span class="pending-name">${state}</span>
                <span class="pending-count">${itemCount} registro(s)</span>
                <span class="pending-arrow">→</span>
            </div>
        `;
    });
    
    if (html === '') {
        html = '<p>Nenhum dado encontrado.</p>';
    }
    
    container.innerHTML = html;
}

function showDataNetworks(stateName) {
    if (typeof stateName === 'undefined' && dataViewState.selectedState) {
        stateName = dataViewState.selectedState;
    }
    
    const type = document.getElementById('dataType').value;
    const stateFilter = document.getElementById('dataState').value;
    const networkFilter = document.getElementById('dataNetwork').value;
    
    dataViewState.level = 'networks';
    dataViewState.selectedState = stateName;
    
    // Atualizar navegação
    document.getElementById('backToDataStates').style.display = 'inline-block';
    document.getElementById('backToDataNetworks').style.display = 'none';
    
    // Mostrar apenas a view de redes
    document.getElementById('dataStatesView').style.display = 'none';
    document.getElementById('dataNetworksView').style.display = 'block';
    document.getElementById('dataDetailsView').style.display = 'none';
    
    document.getElementById('dataNetworksTitle').textContent = `Redes em ${stateName}`;
    
    const container = document.getElementById('dataNetworksList');
    let html = '';
    
    const submissions = type === 'inventory' ? submissionStatus.inventory : submissionStatus.dryBoxes;
    const networksWithData = new Set();
    
    Object.values(submissions).forEach(submission => {
        if (submission.state === stateName) {
            if (!stateFilter || submission.state === stateFilter) {
                if (!networkFilter || submission.network === networkFilter) {
                    networksWithData.add(submission.network);
                }
            }
        }
    });
    
    networksWithData.forEach(network => {
        const itemCount = getDataItemsCountByNetwork(stateName, network, type);
        html += `
            <div class="pending-item" onclick="showDataDetails('${stateName}', '${network}')">
                <span class="pending-name">${network}</span>
                <span class="pending-count">${itemCount} registro(s)</span>
                <span class="pending-arrow">→</span>
            </div>
        `;
    });
    
    if (html === '') {
        html = '<p>Nenhuma rede com dados encontrada.</p>';
    }
    
    container.innerHTML = html;
}

function showDataDetails(stateName, networkName) {
    const type = document.getElementById('dataType').value;
    
    dataViewState.level = 'details';
    dataViewState.selectedState = stateName;
    dataViewState.selectedNetwork = networkName;
    
    // Atualizar navegação
    document.getElementById('backToDataStates').style.display = 'inline-block';
    document.getElementById('backToDataNetworks').style.display = 'inline-block';
    
    // Mostrar apenas a view de detalhes
    document.getElementById('dataStatesView').style.display = 'none';
    document.getElementById('dataNetworksView').style.display = 'none';
    document.getElementById('dataDetailsView').style.display = 'block';
    
    document.getElementById('dataDetailsTitle').textContent = `${networkName} - ${stateName}`;
    
    const container = document.getElementById('dataDetailsList');
    const details = getDataDetails(stateName, networkName, type);
    
    let html = '';
    
    if (details.length > 0) {
        details.forEach(detail => {
            html += `
                <div class="data-detail-item">
                    <div class="data-detail-header">
                        <strong>${detail.store}</strong>
                        <span class="data-detail-user">Usuário: ${detail.user}</span>
                        <span class="data-detail-date">Enviado em: ${detail.timestamp.toLocaleString()}</span>
                    </div>
                    <div class="data-detail-items">
                        ${detail.items.map(item => {
                            if (type === 'inventory') {
                                return `<div class="data-item">
                                    <span class="item-product">${item.productType}</span>
                                    <span class="item-box">${item.boxType}</span>
                                    <span class="item-quantity">${item.quantity} Caixas</span>
                                </div>`;
                            } else {
                                return `<div class="data-item">
                                    <span class="item-product">${item.boxType}</span>
                                    <span class="item-quantity">${item.quantity} Caixas</span>
                                </div>`;
                            }
                        }).join('')}
                    </div>
                </div>
            `;
        });
    } else {
        html = '<p>Nenhum detalhe encontrado.</p>';
    }
    
    container.innerHTML = html;
}

function getDataItemsCountByState(state, type, stateFilter, networkFilter) {
    const submissions = type === 'inventory' ? submissionStatus.inventory : submissionStatus.dryBoxes;
    let count = 0;
    
    Object.values(submissions).forEach(submission => {
        if (submission.state === state) {
            if (!stateFilter || submission.state === stateFilter) {
                if (!networkFilter || submission.network === networkFilter) {
                    count++;
                }
            }
        }
    });
    
    return count;
}

function getDataItemsCountByNetwork(state, network, type) {
    const submissions = type === 'inventory' ? submissionStatus.inventory : submissionStatus.dryBoxes;
    let count = 0;
    
    Object.values(submissions).forEach(submission => {
        if (submission.state === state && submission.network === network) {
            count++;
        }
    });
    
    return count;
}

function getDataDetails(state, network, type) {
    const submissions = type === 'inventory' ? submissionStatus.inventory : submissionStatus.dryBoxes;
    const details = [];
    
    // Buscar nas filas de envio também
    const queue = type === 'inventory' ? inventorySubmissionQueue : dryBoxesSubmissionQueue;
    
    // Adicionar dados das submissões confirmadas
    Object.values(submissions).forEach(submission => {
        if (submission.state === state && submission.network === network) {
            // Buscar itens na fila correspondente
            const queueItem = queue.find(item => 
                item.user === submission.user && 
                item.state === submission.state && 
                item.network === submission.network &&
                item.store === submission.store
            );
            
            if (queueItem) {
                details.push({
                    user: submission.user,
                    store: submission.store,
                    timestamp: submission.timestamp,
                    items: queueItem.items
                });
            }
        }
    });
    
    return details;
}

// Funções para esconder listas
function hideAllUsers() {
    document.getElementById('searchUser').value = '';
    document.getElementById('usersList').innerHTML = '<p>Lista ocultada. Clique em "Exibir Todos" para visualizar.</p>';
}

function hideAllStates() {
    document.getElementById('searchState').value = '';
    document.getElementById('statesList').innerHTML = '<p>Lista ocultada. Clique em "Exibir Todos" para visualizar.</p>';
}

function hideAllNetworks() {
    document.getElementById('searchNetwork').value = '';
    document.getElementById('networksList').innerHTML = '<p>Lista ocultada. Clique em "Exibir Todos" para visualizar.</p>';
}

function hideAllStores() {
    document.getElementById('searchStore').value = '';
    document.getElementById('storesList').innerHTML = '<p>Lista ocultada. Clique em "Exibir Todos" para visualizar.</p>';
}

// Função para salvar todas as configurações
function saveAllConfigurations() {
    try {
        // Salvar configurações de horário primeiro
        saveScheduleSettings();
        
        // Atualizar todos os selects do sistema
        updateConfigSelects();
        updateStateSelects();
        updateUserSelects();
        updateStoreSelects();
        
        // Atualizar selects nas abas principais
        updateNetworksByState();
        updateUsersByState();
        updateDryNetworksByState();
        updateDryUsersByState();
        
        // Atualizar visualizações de dados e usuários pendentes
        initializeDataView();
        updatePendingView();
        
        // Atualizar visualização do gestor
        updateManagerView();
        
        showStatus('Todas as configurações foram salvas e o sistema foi atualizado!', 'success');
        
        console.log('Configurações salvas:', {
            schedule: {
                inventoryTime: systemConfig.inventoryTime,
                inventoryDays: systemConfig.inventoryDays,
                dryBoxesTime: systemConfig.dryBoxesTime,
                dryBoxesDays: systemConfig.dryBoxesDays
            },
            usersByState: systemConfig.usersByState,
            emails: systemConfig.emails,
            networksByState: networksByState,
            storesByNetwork: storesByNetwork
        });
        
    } catch (error) {
        console.error('Erro ao salvar configurações:', error);
        showStatus('Erro ao salvar algumas configurações. Verifique o console para detalhes.', 'error');
    }
}

// Funções para seleção múltipla de usuários
function selectAllUsers() {
    const checkboxes = document.querySelectorAll('#usersList input[type="checkbox"]');
    checkboxes.forEach(checkbox => checkbox.checked = true);
}

function deselectAllUsers() {
    const checkboxes = document.querySelectorAll('#usersList input[type="checkbox"]');
    checkboxes.forEach(checkbox => checkbox.checked = false);
}

function removeSelectedUsers() {
    const selectedItems = document.querySelectorAll('#usersList input[type="checkbox"]:checked');
    
    if (selectedItems.length === 0) {
        showStatus('Selecione pelo menos um usuário para remover!', 'error');
        return;
    }
    
    if (confirm(`Tem certeza que deseja remover ${selectedItems.length} usuário(s) selecionado(s)?`)) {
        selectedItems.forEach(checkbox => {
            const username = checkbox.dataset.username;
            const state = checkbox.dataset.state;
            
            if (systemConfig.usersByState[state]) {
                systemConfig.usersByState[state] = systemConfig.usersByState[state].filter(user => user !== username);
            }
        });
        
        updateUsersList();
        updateUserSelects();
        showStatus(`${selectedItems.length} usuário(s) removido(s) com sucesso!`, 'success');
    }
}

// Funções para seleção múltipla de estados
function selectAllStates() {
    const checkboxes = document.querySelectorAll('#statesList input[type="checkbox"]');
    checkboxes.forEach(checkbox => checkbox.checked = true);
}

function deselectAllStates() {
    const checkboxes = document.querySelectorAll('#statesList input[type="checkbox"]');
    checkboxes.forEach(checkbox => checkbox.checked = false);
}

function removeSelectedStates() {
    const selectedItems = document.querySelectorAll('#statesList input[type="checkbox"]:checked');
    
    if (selectedItems.length === 0) {
        showStatus('Selecione pelo menos um estado para remover!', 'error');
        return;
    }
    
    if (confirm(`Tem certeza que deseja remover ${selectedItems.length} estado(s) selecionado(s) e todas suas redes?`)) {
        selectedItems.forEach(checkbox => {
            const stateName = checkbox.dataset.state;
            
            // Remover todas as redes associadas ao estado
            if (networksByState[stateName]) {
                networksByState[stateName].forEach(network => {
                    delete storesByNetwork[network];
                });
            }
            
            delete networksByState[stateName];
        });
        
        updateStatesList();
        showStatus(`${selectedItems.length} estado(s) removido(s) com sucesso!`, 'success');
    }
}

// Funções para seleção múltipla de redes
function selectAllNetworks() {
    const checkboxes = document.querySelectorAll('#networksList input[type="checkbox"]');
    checkboxes.forEach(checkbox => checkbox.checked = true);
}

function deselectAllNetworks() {
    const checkboxes = document.querySelectorAll('#networksList input[type="checkbox"]');
    checkboxes.forEach(checkbox => checkbox.checked = false);
}

function removeSelectedNetworks() {
    const selectedItems = document.querySelectorAll('#networksList input[type="checkbox"]:checked');
    
    if (selectedItems.length === 0) {
        showStatus('Selecione pelo menos uma rede para remover!', 'error');
        return;
    }
    
    if (confirm(`Tem certeza que deseja remover ${selectedItems.length} rede(s) selecionada(s) e todas suas lojas?`)) {
        selectedItems.forEach(checkbox => {
            const networkName = checkbox.dataset.network;
            
            // Remover das redes por estado
            Object.keys(networksByState).forEach(state => {
                networksByState[state] = networksByState[state].filter(network => network !== networkName);
            });
            
            // Remover das lojas por rede
            delete storesByNetwork[networkName];
        });
        
        updateNetworksList();
        updateConfigSelects();
        showStatus(`${selectedItems.length} rede(s) removida(s) com sucesso!`, 'success');
    }
}

// Funções para seleção múltipla de lojas
function selectAllStores() {
    const checkboxes = document.querySelectorAll('#storesList input[type="checkbox"]');
    checkboxes.forEach(checkbox => checkbox.checked = true);
}

function deselectAllStores() {
    const checkboxes = document.querySelectorAll('#storesList input[type="checkbox"]');
    checkboxes.forEach(checkbox => checkbox.checked = false);
}

function removeSelectedStores() {
    const selectedItems = document.querySelectorAll('#storesList input[type="checkbox"]:checked');
    
    if (selectedItems.length === 0) {
        showStatus('Selecione pelo menos uma loja para remover!', 'error');
        return;
    }
    
    if (confirm(`Tem certeza que deseja remover ${selectedItems.length} loja(s) selecionada(s)?`)) {
        selectedItems.forEach(checkbox => {
            const storeName = checkbox.dataset.store;
            
            Object.keys(storesByNetwork).forEach(network => {
                storesByNetwork[network] = storesByNetwork[network].filter(store => store !== storeName);
            });
        });
        
        updateStoresList();
        showStatus(`${selectedItems.length} loja(s) removida(s) com sucesso!`, 'success');
    }
}

// Funções para seleção múltipla de emails
function selectAllEmails() {
    const checkboxes = document.querySelectorAll('#emailsList input[type="checkbox"]');
    checkboxes.forEach(checkbox => checkbox.checked = true);
}

function deselectAllEmails() {
    const checkboxes = document.querySelectorAll('#emailsList input[type="checkbox"]');
    checkboxes.forEach(checkbox => checkbox.checked = false);
}

function removeSelectedEmails() {
    const selectedItems = document.querySelectorAll('#emailsList input[type="checkbox"]:checked');
    
    if (selectedItems.length === 0) {
        showStatus('Selecione pelo menos um email para remover!', 'error');
        return;
    }
    
    if (confirm(`Tem certeza que deseja remover ${selectedItems.length} email(s) selecionado(s)?`)) {
        selectedItems.forEach(checkbox => {
            const emailAddress = checkbox.dataset.email;
            systemConfig.emails = systemConfig.emails.filter(e => e.address !== emailAddress);
        });
        
        updateEmailsList();
        showStatus(`${selectedItems.length} email(s) removido(s) com sucesso!`, 'success');
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
