
/*

placemark icons:
    default not saved: https://cdn-icons-png.flaticon.com/512/5868/5868069.png

    blue: https://cdn-icons-png.flaticon.com/512/7294/7294032.png
    red: https://cdn-icons-png.flaticon.com/512/252/252025.png

    1 (red) : https://cdn-icons-png.flaticon.com/512/8068/8068017.png
    1 ([2] black) : https://cdn-icons-png.flaticon.com/512/61/61496.png
    2 (red) : https://cdn-icons-png.flaticon.com/512/8068/8068073.png
    2 (orange, like 5[1]) : https://cdn-icons-png.flaticon.com/512/9037/9037217.png
    3 : 
    4 (blue/green, like 1[2]) : https://cdn-icons-png.flaticon.com/512/8921/8921763.png
    5 ([1]blue/green) : https://cdn-icons-png.flaticon.com/512/3601/3601646.png

*/

var db = null;
var fdb = {};
var map = null;
var params = {
    'HasDressingRoom' : false,
    'HasEatery' : false,
    'HasToilet' : false,
    'HasWifi' : false,
    'HasFirstAidPost' : false,
};
var saved = [];
var reg = true;

function connect_db(jsonStr) {
    db = JSON.parse(jsonStr);
    db.forEach((el) => {
        fdb[el['global_id']] = el;
    });
    console.log(db[0]);
}

function init() {
    map = new ymaps.Map('map', {
        center : [55.7522, 37.6156],
        zoom : 10,
    });

    map.controls.remove('geolocationControl') // удаляет геолокацию
    map.controls.remove('searchControl') // удаляет поиск
    map.controls.remove('trafficControl') // удаляет контроль трафика
    map.controls.remove('typeSelector') // удаляет тип
    map.controls.remove('fullscreenControl') // удаляет кнопку перехода в полный экран
    map.controls.remove('rulerControl')
    map.controls.remove('zoomControl')

    let placemarks = [];
    let saved_placemarks = [];
    Object.entries(fdb).forEach(([key, el]) => {
        let preCoords = el['geoData']['coordinates'];
        let icon = (saved[key] == undefined)
            ? 'https://cdn-icons-png.flaticon.com/512/5868/5868069.png'
            : 'https://cdn-icons-png.flaticon.com/512/252/252025.png';
        let placemark = new ymaps.Placemark(
            [preCoords[1], preCoords[0]],
            {
                // balloonContent: `
                // <p>`+el['Address']+', '+el['NameWinter']+`</p>
                // `
            },
            {
                iconLayout: 'default#image',
                iconImageHref: icon,
                iconImageSize: [40, 40],
                iconImageOffset: [-20, -40],
            }
        );

        placemark.events.add('click', function(e) {
            on_click_placemark(key);
        });

        (saved[key] == undefined)
            ? placemarks.push(placemark)
            : saved_placemarks.push(placemark);
        
    });

    placemarks.forEach((el) => map.geoObjects.add(el));
    saved_placemarks.forEach((el) => map.geoObjects.add(el));

}


function build_route(id) {
    console.log(id);
    on_click_placemark(id)

    map.controls.remove('routePanelControl');
    map.controls.add('routePanelControl');

    let myLocationText = '';

    navigator.geolocation.getCurrentPosition(function(location) {
        
        let rg = ymaps.geocode([location.coords.latitude, location.coords.longitude]);

        rg.then(function(res) {
            myLocationText = res.geoObjects.get(0).properties.get('text');
        
            let control = map.controls.get('routePanelControl');
            control.routePanel.state.set({
                type: 'auto',
                fromEnabled: false, // можно ли менять поле from (нач. точка)
                from: myLocationText,
                toEnabled: false,
                to: 'Москва, '+fdb[id]['Address']
            })
        
        });

    });

}


function update_map_html() {
    let map_wrap = document.getElementsByClassName('map-wrap')[0];
    let map = document.getElementById('map');

    map.remove()

    map_wrap.innerHTML += '<div class="map" id="map"></div>';
}


function filter_db() {
    function ntime(txt) {
        let [h, m] = txt.split(':');
        return Number(h)*60+Number(m)
    }
    
    let i_time = document.getElementById('i-time').value,
        i_date = document.getElementById('i-date').value;

    fdb = {};

    let day = new Date(i_date).getDay();
    console.log(day);

    if (i_time == '') i_time = (new Date().getHours()) + ':' + (new Date().getMinutes());

    for (let i=0; i<db.length; i++) {
        time_period = db[i]['WorkingHoursWinter'][day]['Hours'];
        let time_pst = false;
        if (time_period == 'круглосуточно') {
            time_pst = true;
        } else {
            time_period = time_period.split('-')
                .map((el) => ntime(el));
            if (ntime(i_time) > time_period[0] && ntime(i_time) < time_period[1]) time_pst = true;
        }

        if (time_pst) {
            if ((params['HasDressingRoom'] && db[i]['HasDressingRoom']=='да' || !params['HasDressingRoom']) &&
                (params['HasEatery'] && db[i]['HasEatery']=='да' || !params['HasEatery']) &&
                (params['HasToilet'] && db[i]['HasToilet']=='да' || !params['HasToilet']) &&
                (params['HasWifi'] && db[i]['HasWifi']=='да' || !params['HasWifi']) &&
                (params['HasFirstAidPost'] && db[i]['HasFirstAidPost']=='да' || !params['HasFirstAidPost'])) {
                    fdb[db[i]['global_id']] = db[i]
            }
        }
    }

}


function apply_filter() {

    update_map_html();
    filter_db();
    fill_areas();
    init();
    set_on_click_to_placemarks();

    let body = document.getElementsByClassName('content')[0];
    window.scrollTo({
        top: body.scrollHeight,
        behavior : 'smooth'
    })

}


function fill_areas() {
    let i_date = document.getElementById('i-date').value
    let day = new Date(i_date).getDay();
    let container = document.getElementById('areas');
    container.innerHTML = '';
    Object.entries(fdb).forEach(([key, el]) => {
        let bottom = (saved[key] == undefined)
            ? `<button type="submit" class="remember-btn" onfocus="remember('`+key+`')">Запомнить</button>`
            : `<div class="comment"><pre>`+saved[key]+`</pre></div>`;
        if (!reg) bottom = '';

        container.innerHTML += get_area_item(
            key, 
            el['Address']+', '+el['NameWinter'],
            `
            <p>Адрес: `+el['Address']+`</p>
            <p>`+el['Paid']+`</p>
            <p>`+el['Lighting']+`</p>
            <p>`+el['SurfaceTypeWinter']+`</p>
            <p>График работы на `+new Date(i_date).toLocaleDateString()+`: `+el['WorkingHoursWinter'][day]['Hours']+`</p>
            <p>Телефон: `+el['HelpPhone']+`</p>
            <p>Сайт: <a href='`+el['WebSite']+`'>`+el['WebSite']+`</a></p>
            ` + bottom,
            (saved[key] != undefined)
        );
    })
}


function remember(id) {
    let str_obj = JSON.stringify(fdb[id]).replaceAll('"', "''''");
    let res = document.getElementById('res');
    res.innerHTML = '<input name="save_area" value="'+str_obj+'" hidden>';
}


function set_on_click_to_placemarks() {
    $(document).ready(function() {
        $('ymaps-2-1-79-placemark-overlay').click(function() {
            on_click_placemark();
        });
    });
}


function show_hide(id) {
    let item = document.getElementById(id);
    let btn = item.children[0].children[1];
    if (item.children[1].classList.contains('hidden')) {
        item.children[1].classList.remove('hidden');
        btn.textContent = 'Скрыть';
    }
    else {
        item.children[1].classList.add('hidden');
        btn.textContent = 'Развернуть';
    }
}

function get_area_item(id, name, description, saved=false) {
    let saved_class = (saved)?' saved':''
    return `
    <div class="area-item`+ saved_class +`" id="`+id+`">
        <div class="name">
            <p class="name-txt" onclick="build_route('`+id+`')">`+name+`</p>
            <div class="show-hide" onclick="show_hide('`+id+`')">Развернуть</div>    
        </div>
        <div class="area-desc hidden">
            `+description+`
        </div>
    </div>
    `;
}

function on_click_placemark(id) {
    map.controls.remove('routePanelControl');
    let container = document.getElementById('areas');
    
    for (let i=0; i<container.childElementCount; i++) {
        container.children[i].classList.remove('area-selected')
    }
    
    let area = document.getElementById(id);
    area.scrollIntoView({
        behavior : 'smooth'
    });
    area.classList.add('area-selected')
}


function click_params(key) {
    params[key] = !params[key];

    let btn = document.getElementById(key);
    (btn.classList.contains('check-btn-on'))
        ? btn.classList.remove('check-btn-on')
        : btn.classList.add('check-btn-on');
}


function set_today() {
    let date = document.getElementById('i-date'),
        time = document.getElementById('i-time');
    
    let today = new Date();

    date.value = today.toISOString().slice(0, 10);
    time.value = today.toLocaleTimeString().slice(0, 5);
    console.log(today.toLocaleTimeString());
}