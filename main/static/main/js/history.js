
var db = {};
var csrf = null;
var bin = '';

function connect_db(jsonStr) {
    let obj = JSON.parse(jsonStr);
    obj.forEach((el) => {
        db[el['global_id']] = el;
    });
}

function load_area(id, comment, opened=false) {
    let container = document.getElementById('content');
    container.innerHTML += get_area_item(id, comment)
    if (opened) {
        show_hide(id)
        let item = document.getElementById(id);
        item.scrollIntoView();
    }
}

function get_area_item(id, comment) {
    return `
    <div class="area-item area-item-hidden" id="`+id+`" onclick="show_hide('`+id+`')">
        <p class="name-txt"><b>`+db[id]['Address']+', '+db[id]['NameWinter']+`</b></p>
        <div class="details-wrap hidden">
            <div class="desc">
                <p>Адрес: `+db[id]['Address']+`</p>
                <p>`+db[id]['Paid']+`</p>
                <p>`+db[id]['Lighting']+`</p>
                <p>`+db[id]['SurfaceTypeWinter']+`</p>
                <p>Телефон: `+db[id]['HelpPhone']+`</p>
                <p>Сайт: <a href='`+db[id]['WebSite']+`'>`+db[id]['WebSite']+`</a></p>
                <form method="post">
                `+csrf+`
                <input type="hidden" name="del_id" value="`+id+`">
                <button type="submit" class="trash" onclick="">
                    <img src="`+bin+`" class="trash-img">
                </button>
                </form>
            </div>
            <div class="comment">
            <form method="post">
                `+csrf+`
                <p>Ваш комментарий:</p>
                <textarea name="comment" class="comment-ta">`+comment+`</textarea>
                <input type="hidden" name="id" value="`+id+`">
                <button type="submit" class="remember-btn">Сохранить</button>
            </div>
            </form>
        </div>
    </div>`;
}


function show_hide(id) {
    let showed = document.getElementsByClassName('showed')[0];
    if (showed!=null) {
        // если нажали на уже открытый элемент
        if (showed.id == id) {
            return null;
        }
        showed.classList.remove('showed');
        showed.classList.add('area-item-hidden');
        showed.children[1].classList.add('hidden');
    }
    
    let item = document.getElementById(id);
    item.classList.remove('area-item-hidden');
    item.classList.add('showed');
    item.children[1].classList.remove('hidden');
    item.scrollIntoView({
        behavior: "smooth"
    })
}
