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
    setupResidentCityDependency();
    setupDemandCityDependency();
    setupFormSubmit();
});

function loadDemandTypes() {
    const demandTypeSelect = document.getElementById('demandType');
    demandTypeSelect.innerHTML = '<option value="">Selecione o tipo de demanda</option>' +
        DEMAND_TYPES.map(t => `<option value="${t.value}">${t.label}</option>`).join('');
}

function loadStateElement(stateSelectId) {
    const stateSelect = document.getElementById(stateSelectId);
    stateSelect.innerHTML = '<option value="">Selecione o estado</option>' +
        states.sort().map(state => `<option value="${state}">${state}</option>`).join('');
}

function loadStates() {
    loadStateElement('resident-state');
    loadStateElement('demand-state');
}

async function loadCities(stateSelectId,citySelectId) {
    const citySelect = document.getElementById(citySelectId);
    const stateSelect = document.getElementById(stateSelectId);
    citySelect.disabled = true;
    citySelect.innerHTML = '<option value="">Carregando...</option>';
    
    stateSelect.addEventListener('change', async () => {
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
        }   catch (error) {
            console.error('Erro ao carregar as cidades:', error);
            citySelect.innerHTML = '<option value="">Erro ao carregar cidades</option>';
        }
    })
}

function setupResidentCityDependency() {
    loadCities('resident-state', 'resident-city');
}

function setupDemandCityDependency() {
    loadCities('demand-state', 'demand-city');
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
        const {address} = demand
            ? `${address.street} - ${address.district}, ${address.city} - ${address.state}`
            : '—';
        const status = statusStyle[demand.status] || { style: '', message: demand.status };
        const type = DEMAND_TYPES.find(t => t.value === demand.type)?.label || demand.type;
        const isFinished = demand.status === statusStyle.FINISHED.name;
        return `
            <tr>
                <td>${demand.title ?? '—'}</td>
                <td>${demand.description ?? '—'}</td>
                <td>${type}</td>
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

        const residentStreet = document.getElementById('resident-street').value;
        const residentDistrict = document.getElementById('resident-district').value;
        const residentCity = document.getElementById('resident-city').value;
        const residentState = document.getElementById('resident-state').value;

        const demandStreet = document.getElementById('demand-street').value;
        const demandDistrict = document.getElementById('demand-district').value;
        const demandCity = document.getElementById('demand-city').value;
        const demandState = document.getElementById('demand-state').value;

        const title = document.getElementById('title').value;
        const description = document.getElementById('description').value;
        const demandType = document.getElementById('demandType').value;

        try {
            const residentAddressResponse = await fetch(`${API_BASE_URL}/address/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ street: residentStreet, district: residentDistrict, city: residentCity, state: residentState }),
            });
            if (!residentAddressResponse.ok) throw new Error('Erro ao registrar endereço');
            const residentAddress = await residentAddressResponse.json();

            const residentResponse = await fetch(`${API_BASE_URL}/residents/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    full_name: nome,
                    cpf: cpf,
                    phone: telefone,
                    address_id: residentAddress.id,
                }),
            });
            if (!residentResponse.ok) throw new Error('Erro ao registrar morador');
            const resident = await residentResponse.json();

            const demandAddressResponse = await fetch(`${API_BASE_URL}/address/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ street: demandStreet, district: demandDistrict, city: demandCity, state: demandState }),
            });
            if (!demandAddressResponse.ok) throw new Error('Erro ao registrar endereço');
            const demandAddress = await demandAddressResponse.json();

            const demandResponse = await fetch(`${API_BASE_URL}/demands`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: title,
                    description: description,
                    type: demandType,
                    address_id: demandAddress.id,
                    resident_id: resident.id,
                }),
            });
            if (!demandResponse.ok) throw new Error('Erro ao registrar demanda');

            alert('Demanda enviada com sucesso!');
            demandaForm.reset();
            document.getElementById('resident-city').innerHTML = '<option value="">Selecione um estado primeiro</option>';
            document.getElementById('demand-city').innerHTML = '<option value="">Selecione um estado primeiro</option>';
            loadDemands();
        } catch (error) {
            console.error('Falha na requisição:', error);
            alert('Ocorreu um erro: ' + error.message);
        }
    });
}