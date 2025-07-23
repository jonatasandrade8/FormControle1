
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
    
    // Atualizar filas de envio
    updateManagerQueueViews(stateFilter, networkFilter);
}

function updateManagerQueueViews(stateFilter, networkFilter) {
    updateManagerInventoryQueue(stateFilter, networkFilter);
    updateManagerDryBoxesQueue(stateFilter, networkFilter);
}

function updateManagerInventoryQueue(stateFilter, networkFilter) {
    const container = document.getElementById('managerInventoryQueue');
    let html = '';
    
    inventorySubmissionQueue.forEach((submission, index) => {
        if ((!stateFilter || submission.state === stateFilter) &&
            (!networkFilter || submission.network === networkFilter)) {
            html += `<div class="queue-item">
                <div class="queue-header">
                    <div class="queue-user-info">
                        <strong>${submission.user}</strong> - ${submission.store}
                        <br><small>Estado: ${submission.state} | Rede: ${submission.network}</small>
                        <br><small>Adicionado em: ${submission.timestamp.toLocaleString()}</small>
                    </div>
                    <div class="queue-actions">
                        <button class="edit-btn" onclick="editQueueSubmission('inventory', ${index})">Editar</button>
                        <button class="delete-btn" onclick="deleteQueueSubmission('inventory', ${index})">Excluir</button>
                    </div>
                </div>
                <div class="queue-items-list">
                    <strong>Itens (${submission.items.length}):</strong>
                    ${submission.items.map(item => 
                        `<div class="queue-item-detail">
                            ${item.productType} - ${item.boxType} (${item.quantity} unidades)
                        </div>`
                    ).join('')}
                </div>
            </div>`;
        }
    });
    
    if (html === '') {
        html = '<p>Nenhum envio pendente de inventário.</p>';
    }
    
    container.innerHTML = html;
}

function updateManagerDryBoxesQueue(stateFilter, networkFilter) {
    const container = document.getElementById('managerDryBoxesQueue');
    let html = '';
    
    dryBoxesSubmissionQueue.forEach((submission, index) => {
        if ((!stateFilter || submission.state === stateFilter) &&
            (!networkFilter || submission.network === networkFilter)) {
            html += `<div class="queue-item">
                <div class="queue-header">
                    <div class="queue-user-info">
                        <strong>${submission.user}</strong> - ${submission.store}
                        <br><small>Estado: ${submission.state} | Rede: ${submission.network}</small>
                        <br><small>Adicionado em: ${submission.timestamp.toLocaleString()}</small>
                    </div>
                    <div class="queue-actions">
                        <button class="edit-btn" onclick="editQueueSubmission('dryBoxes', ${index})">Editar</button>
                        <button class="delete-btn" onclick="deleteQueueSubmission('dryBoxes', ${index})">Excluir</button>
                    </div>
                </div>
                <div class="queue-items-list">
                    <strong>Itens (${submission.items.length}):</strong>
                    ${submission.items.map(item => 
                        `<div class="queue-item-detail">
                            ${item.boxType} (${item.quantity} unidades)
                        </div>`
                    ).join('')}
                </div>
            </div>`;
        }
    });
    
    if (html === '') {
        html = '<p>Nenhum envio pendente de caixas secas.</p>';
    }
    
    container.innerHTML = html;
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
