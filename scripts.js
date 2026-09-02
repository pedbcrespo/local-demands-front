const API_BASE_URL = 'http://127.0.0.1:5000/local-demands';

const DEMAND_TYPES = [
    { value: 'STRUCTURAL', label: 'Estrutural' },
    { value: 'PERIODIC', label: 'Periódica' },
    { value: 'EMERGENCY', label: 'Emergencial' },
];

const statusStyle = {
    PENDING: { name: 'PENDING', style: 'status-pendent', message: 'PENDENTE' },
    FINISHED: { name: 'FINISHED', style: 'status-finished', message: 'CONCLUIDO' },
};

const states = [
    "AC",
    "AL",
    "AP",
    "AM",
    "BA",
    "CE",
    "DF",
    "ES",
    "GO",
    "MA",
    "MT",
    "MS",
    "MG",
    "PA",
    "PB",
    "PR",
    "PE",
    "PI",
    "RJ",
    "RN",
    "RS",
    "RO",
    "RR",
    "SC",
    "SP",
    "SE",
    "TO"
];

document.addEventListener('DOMContentLoaded', () => {
    loadDemandTypes();
    loadStates();
    loadDemands();
    setupCityDependency();
    setupFormSubmit();
});

function loadDemandTypes() {
    const demandTypeSelect = document.getElementById('demandType');
    demandTypeSelect.innerHTML = '<option value="">Selecione o tipo de demanda</option>' +
        DEMAND_TYPES.map(t => `<option value="${t.value}">${t.label}</option>`).join('');
}

async function loadStates() {
    const stateSelect = document.getElementById('state');
    try {
        stateSelect.innerHTML = '<option value="">Selecione o estado</option>' +
        states.sort().map(state => `<option value="${state}">${state}</option>`).join('');
    } catch (error) {
        console.error('Erro ao carregar os Estados:', error);
        stateSelect.innerHTML = '<option value="">Erro ao carregar estados</option>';
    }
}

function setupCityDependency() {
    const stateSelect = document.getElementById('state');
    const citySelect = document.getElementById('city');

    stateSelect.addEventListener('change', async () => {
        citySelect.disabled = true;
        citySelect.innerHTML = '<option value="">Carregando...</option>';

        if (!stateSelect.value) {
            citySelect.innerHTML = '<option value="">Selecione um estado primeiro</option>';
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/address/state/${stateSelect.value}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
            });
            if (!response.ok) throw new Error(`Erro HTTP: ${response.status}`);

            const cities = await response.json();
            citySelect.innerHTML = '<option value="">Selecione uma cidade</option>' +
                cities.sort().map(city => `<option value="${city.city_name}">${city.city_name}</option>`).join('');
            citySelect.disabled = false;
        } catch (error) {
            console.error('Erro ao carregar as cidades:', error);
            citySelect.innerHTML = '<option value="">Erro ao carregar cidades</option>';
        }
    });
}

async function finishDemand(id, checkboxElement) {
    try {
        const response = await fetch(`${API_BASE_URL}/demands/${id}/finish`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
        });

        if (!response.ok) {
            throw new Error(`Erro ao finalizar demanda. Status: ${response.status}`);
        }

        alert(`Demanda finalizada com sucesso!`);
        loadDemands();

    } catch (error) {
        console.error('Erro ao finalizar demanda:', error);
        alert('Falha ao finalizar a demanda.');
        checkboxElement.checked = false;
    }
}

async function loadDemands() {
    const tbody = document.getElementById('demandas-tbody');
    if (!tbody) {
        console.error('Elemento #demandas-tbody não encontrado no HTML.');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/demands`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
        });
        if (!response.ok) throw new Error(`Erro HTTP: ${response.status}`);

        const demands = await response.json();
        renderDemands(demands);
    } catch (error) {
        console.error('Erro ao carregar as demandas:', error);
        tbody.innerHTML = '<tr><td colspan="4">Não foi possível carregar as demandas.</td></tr>';
    }
}

function renderDemands(demands) {
    const tbody = document.getElementById('demandas-tbody');

    if (!demands || demands.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4">Nenhuma demanda registrada ainda.</td></tr>';
        return;
    }

    tbody.innerHTML = demands.map(demand => {
        const address = demand.address
            ? `${demand.address.street} - ${demand.address.district}, ${demand.address.city} - ${demand.address.state}`
            : '—';
        const status = statusStyle[demand.status] || { style: '', message: demand.status };
        const isFinished = demand.status === statusStyle.FINISHED.name;
        return `
            <tr>
                <td>${demand.resident ?? '—'}</td>
                <td>${demand.description}</td>
                <td>${address}</td>
                <td><span class="status-badge ${status.style}">${status.message}</span></td>
                <td id="demand-${demand.id}" class="clicable-option">
                    <input 
                        type="checkbox" 
                        id="checkbox-demand-${demand.id}" 
                        class="finish-demand-checkbox"
                        ${isFinished ? 'checked disabled' : ''}
                        onchange="finishDemand(${demand.id}, this)">
                </td>
            </tr>
        `;
    }).join('');
}

function setupFormSubmit() {
    const demandaForm = document.getElementById('demandaForm');
    if (!demandaForm) return;

    demandaForm.addEventListener('submit', async function (event) {
        event.preventDefault();

        const nome = document.getElementById('nome').value;
        const cpf = document.getElementById('cpf').value;
        const telefone = document.getElementById('telefone').value;

        const street = document.getElementById('street').value;
        const district = document.getElementById('district').value;
        const city = document.getElementById('city').value;
        const state = document.getElementById('state').value;

        const title = document.getElementById('title').value;
        const description = document.getElementById('description').value;
        const demandType = document.getElementById('demandType').value;

        try {
            const addressResponse = await fetch(`${API_BASE_URL}/address/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ street, district, city, state }),
            });
            if (!addressResponse.ok) throw new Error('Erro ao registrar endereço');
            const address = await addressResponse.json();

            const residentResponse = await fetch(`${API_BASE_URL}/residents/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    full_name: nome,
                    cpf: cpf,
                    phone: telefone,
                    address_id: address.id,
                }),
            });
            if (!residentResponse.ok) throw new Error('Erro ao registrar morador (CPF já cadastrado?)');
            const resident = await residentResponse.json();

            const demandResponse = await fetch(`${API_BASE_URL}/demands`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: title,
                    description: description,
                    type: demandType,
                    address_id: address.id,
                    resident_id: resident.id,
                }),
            });
            if (!demandResponse.ok) throw new Error('Erro ao registrar demanda');

            alert('Demanda enviada com sucesso!');
            demandaForm.reset();
            document.getElementById('city').innerHTML = '<option value="">Selecione um estado primeiro</option>';
            loadDemands();
        } catch (error) {
            console.error('Falha na requisição:', error);
            alert('Ocorreu um erro: ' + error.message);
        }
    });
}