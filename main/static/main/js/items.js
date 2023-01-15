
function generate_my_element(bin_link, name) {
    return `
    <div class="my-item" data-content="`+name+`">
        <div class="my-item-w1">
            <div class="trash" onclick="del_element('`+name+`')">
                <img class="trash-img" src="`+bin_link+`">
            </div>
            <div class="item-name">`+name+`</div>
        </div>
        <div class="my-item-w2" onclick="select('`+name+`')">
            <div class="check"></div>
        </div>
    </div>
    `;
}


function show_hide_category(btn, name) {
    let category = document.getElementById(name);
    let button = document.getElementById(btn);

    if (category.classList.contains("hidden")) {
        category.classList.remove('hidden');
        button.innerHTML = 'Скрыть'
    }
    else {
        category.classList.add('hidden');
        button.innerHTML = 'Показать'
    }
    
}



function add_element() {
    let form = document.getElementById('add-el-container');
    form.classList.remove('hidden');

    let btn = document.getElementById('add-el-btn');
    btn.classList.add('hidden');

    let save_btn = document.getElementById('save-page-btn');
    save_btn.classList.add('hidden');
}

function cancel() {
    let form = document.getElementById('add-el-container');
    form.classList.add('hidden');

    let input = document.getElementById('add-el-field');
    input.value = '';

    let btn = document.getElementById('add-el-btn');
    btn.classList.remove('hidden');

    let save_btn = document.getElementById('save-page-btn');
    save_btn.classList.remove('hidden');
}

function add_element_from_input(bin_link) {
    let input = document.getElementById('add-el-field');
    let container = document.getElementsByClassName('my-list-content')[0];

    let text = input.value;
    text = text.replace(/[,:"]/g, '');
    
    container.innerHTML += generate_my_element(bin_link, text);
    container.scrollTo({
        top: container.scrollHeight,
        behavior : 'smooth'
    });
    
    cancel()
}

function del_element(name) {
    let list = document.getElementsByClassName('my-item');
    for (let i=0; i<list.length; i++) {
        let val = list[i].getAttribute('data-content');
        if (val == name) {
            list[i].remove()
        }
    }
}


function on_save_btn() {
    
    let list = document.getElementsByClassName('my-item');
    
    let html = '<input name="items" value="';

    for (let i=0; i<list.length; i++) {
        let val = list[i].getAttribute('data-content');
        let checked = list[i].classList.contains('ready-item');
        html += val+':'+(checked?1:0)+',';
    }
    html += '" hidden>';

    res = document.getElementById('res');
    res.innerHTML = html;
}

function select(name) {
    list = document.getElementsByClassName('my-item');
    for (let i=0; i<list.length; i++) {
        let val = list[i].getAttribute('data-content');
        if (val == name) {
            
            if (list[i].classList.contains('ready-item')) {
                list[i].classList.remove('ready-item');
                list[i].children[0].children[0].classList.remove('ready-trash');
                list[i].children[1].children[0].classList.remove('ready-check');
            } else {
                list[i].classList.add('ready-item');
                list[i].children[0].children[0].classList.add('ready-trash');
                list[i].children[1].children[0].classList.add('ready-check');
            }
        
        }
    }
}


function add_element_from_std(bin_link, name) {
    let container = document.getElementsByClassName('my-list-content')[0];
    container.innerHTML += generate_my_element(bin_link, name);

    container.scrollTo({
        top: container.scrollHeight,
        behavior : 'smooth'
    });
}