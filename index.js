const API_BASE_URL = 'http://127.0.0.1:5000/local-demands'; 

const statusStyle = {
    PENDENT: {style: 'status-pendent', message: 'PENDENTE'},
    FINISHED: {style: 'status-finished', message: 'CONCLUIDO'}
}

// DEMANDS
document.addEventListener('DOMContentLoaded', async () => {

})

// DEMAND-TYPES
document.addEventListener('DOMContentLoaded', async () => {
    const demandTypeSelect = document.getElementById('demandType');

    try {
        const response = await fetch(`${API_BASE_URL}/types`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
        });

        if (!response.ok) {
            throw new Error(`Erro HTTP: ${response.status}`);
        }

        const demandTypes = await response.json();
        demandTypeSelect.innerHTML = '<option value="">Select a demand type</option>';
        demandTypes.forEach(type => {
            const option = document.createElement('option');
            option.value = type;
            option.textContent = type;
            demandTypeSelect.appendChild(option);
        });

    } catch (error) {
        console.error('Erro ao carregar os tipos de demanda:', error);
        demandTypeSelect.innerHTML = '<option value="">Error loading types</option>';
    }
});

// STATES
document.addEventListener('DOMContentLoaded', async () => {
    const stateSelect = document.getElementById('state');
    try {
        const response = await fetch(`${API_BASE_URL}/address/state`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
        });
        if(!response.ok)
            throw new Error(`Erro HTTP: ${response.status}`);
        const states = await response.json();
        stateSelect.innerHTML = '<option value="">Select a demand type</option>';
        states.forEach(state => {
            const option = document.createElement('option');
            option.value = state;
            option.textContent = state;
            stateSelect.appendChild(option);
        })
    } catch (error) {
        console.error('Erro ao carregar os Estados:', error);
        demandTypeSelect.innerHTML = '<option value="">Error loading types</option>';
    }
});

// FORM
document.addEventListener('DOMContentLoaded', () => {
    const demandaForm = document.getElementById('demandaForm');

    if (demandaForm) {
        demandaForm.addEventListener('submit', async function(event) {
            event.preventDefault();
            const nome = document.getElementById('name').value;
            const cpf = document.getElementById('cpf').value;
            const telefone = document.getElementById('phone').value;
            
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
                    body: JSON.stringify({
                        street: street,
                        district: district,
                        city: city,
                        state: state
                    })
                });

                if (!addressResponse.ok) {
                    throw new Error('Erro ao registrar endereço');
                }
                
                const addressData = await addressResponse.json();
                const addressId = addressData.id;

                const residentResponse = await fetch(`${API_BASE_URL}/resident/register`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        full_name: nome,
                        cpf: cpf,
                        phone: telefone,
                        address_id: addressId
                    })
                });

                if (!residentResponse.ok) {
                    throw new Error('Erro ao registrar morador');
                }

                const residentData = await residentResponse.json();
                const residentId = residentData.id;

                const demandResponse = await fetch(`${API_BASE_URL}/demands`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        title: title,
                        description: description,
                        type: demandType,
                        resident_id: residentId
                    })
                });

                if (!demandResponse.ok) {
                    throw new Error('Erro ao registrar demanda');
                }

                alert('Demanda enviada com sucesso!');
                this.reset(); // Limpa o formulário após envio com sucesso

            } catch (error) {
                console.error('Falha na requisição:', error);
                alert('Ocorreu um erro: ' + error.message);
            }
        });
    }
});