
// Dados das lojas por rede
const storesByNetwork = {
    "Rede Norte": ["Loja Norte Shopping", "Loja Norte Center", "Loja Norte Plaza"],
    "Rede Sul": ["Loja Sul Shopping", "Loja Sul Center", "Loja Sul Plaza"],
    "Rede Centro": ["Loja Centro Shopping", "Loja Centro Mall", "Loja Centro Plaza"],
    "Rede Leste": ["Loja Leste Shopping", "Loja Leste Center", "Loja Leste Plaza"]
};

// Array para armazenar os itens do inventário
let inventoryItems = [];

// Função para atualizar as lojas baseado na rede selecionada
function updateStores() {
    const networkSelect = document.getElementById('network');
    const storeSelect = document.getElementById('store');
    const selectedNetwork = networkSelect.value;
    
    // Limpa as opções atuais
    storeSelect.innerHTML = '<option value="">Selecione uma loja</option>';
    
    // Adiciona as lojas da rede selecionada
    if (selectedNetwork && storesByNetwork[selectedNetwork]) {
        storesByNetwork[selectedNetwork].forEach(store => {
            const option = document.createElement('option');
            option.value = store;
            option.textContent = store;
            storeSelect.appendChild(option);
        });
    }
}

// Função para adicionar item ao inventário
document.getElementById('stockForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const formData = new FormData(this);
    const item = {
        user: formData.get('user'),
        network: formData.get('network'),
        store: formData.get('store'),
        productType: formData.get('productType'),
        boxType: formData.get('boxType'),
        quantity: parseInt(formData.get('quantity'))
    };
    
    // Adiciona o item ao array
    inventoryItems.push(item);
    
    // Atualiza a exibição dos itens
    updateItemsDisplay();
    
    // Limpa o formulário (mantém usuário, rede e loja selecionados)
    document.getElementById('productType').value = '';
    document.getElementById('boxType').value = '';
    document.getElementById('quantity').value = '';
    
    // Mostra o botão de enviar
    document.getElementById('submitAll').style.display = 'block';
    
    showStatus('Item adicionado com sucesso!', 'success');
});

// Função para atualizar a exibição dos itens
function updateItemsDisplay() {
    const itemsContainer = document.getElementById('items');
    
    if (inventoryItems.length === 0) {
        itemsContainer.innerHTML = '<p>Nenhum item adicionado ainda.</p>';
        document.getElementById('submitAll').style.display = 'none';
        return;
    }
    
    // Agrupa itens por rede
    const itemsByNetwork = {};
    inventoryItems.forEach((item, index) => {
        if (!itemsByNetwork[item.network]) {
            itemsByNetwork[item.network] = [];
        }
        itemsByNetwork[item.network].push({...item, index});
    });
    
    let html = '';
    Object.keys(itemsByNetwork).forEach(network => {
        html += `<div class="network-group">
            <div class="network-title">${network}</div>`;
        
        itemsByNetwork[network].forEach(item => {
            html += `<div class="item">
                <div class="item-info">
                    <strong>${item.productType}</strong> - ${item.store}
                    <div class="item-details">
                        Usuário: ${item.user} | Caixa: ${item.boxType} | Quantidade: ${item.quantity}
                    </div>
                </div>
                <button class="remove-btn" onclick="removeItem(${item.index})">Remover</button>
            </div>`;
        });
        
        html += '</div>';
    });
    
    itemsContainer.innerHTML = html;
}

// Função para remover item
function removeItem(index) {
    inventoryItems.splice(index, 1);
    updateItemsDisplay();
    
    if (inventoryItems.length === 0) {
        showStatus('', '');
    }
}

// Função para enviar inventário
function submitInventory() {
    if (inventoryItems.length === 0) {
        showStatus('Nenhum item para enviar!', 'error');
        return;
    }
    
    // Simula o envio por email
    const emailData = prepareEmailData();
    
    // Aqui você integraria com um serviço de email real
    console.log('Dados para envio por email:', emailData);
    
    showStatus('Inventário enviado com sucesso! (Simulado)', 'success');
    
    // Limpa o inventário após envio
    inventoryItems = [];
    updateItemsDisplay();
}

// Função para preparar dados para email
function prepareEmailData() {
    const itemsByNetwork = {};
    let totalItems = 0;
    
    inventoryItems.forEach(item => {
        if (!itemsByNetwork[item.network]) {
            itemsByNetwork[item.network] = [];
        }
        itemsByNetwork[item.network].push(item);
        totalItems += item.quantity;
    });
    
    return {
        timestamp: new Date().toISOString(),
        totalItems: totalItems,
        networks: itemsByNetwork,
        summary: `Inventário com ${inventoryItems.length} produtos diferentes totalizando ${totalItems} caixas`
    };
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

// Função para envio automático às 13:00 (simulado)
function scheduleAutomaticSubmission() {
    const now = new Date();
    const target = new Date();
    target.setHours(13, 0, 0, 0);
    
    // Se já passou das 13:00 hoje, agenda para amanhã
    if (now > target) {
        target.setDate(target.getDate() + 1);
    }
    
    const timeUntilSubmission = target - now;
    
    setTimeout(() => {
        if (inventoryItems.length > 0) {
            submitInventory();
            showStatus('Inventário enviado automaticamente às 13:00!', 'success');
        }
        
        // Reagenda para o próximo dia
        scheduleAutomaticSubmission();
    }, timeUntilSubmission);
    
    console.log(`Próximo envio automático agendado para: ${target.toLocaleString()}`);
}

// Inicia o agendamento automático quando a página carrega
document.addEventListener('DOMContentLoaded', function() {
    scheduleAutomaticSubmission();
    updateItemsDisplay();
});
