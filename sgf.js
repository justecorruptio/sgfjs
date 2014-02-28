//TODO
//  Alternate branches
//  keyboard control

(function(){

var is_mobile = navigator.userAgent.match(/iPhone|android/i);

var HOSHI = {
    9: [20, 24, 40, 56, 60],
    13: [42, 48, 84, 120, 126],
    19: [60, 66, 72, 174, 180, 186, 288, 294, 300]
}

function arraysEqual(a, b) {
    if (a === b) return true;
    if (a == null || b == null) return false;
    if (a.length != b.length) return false;

    for (var i = 0; i < a.length; ++i) {
        if (a[i] !== b[i]) return false;
    }
    return true;
}

function parse_sgf_data(data){
    data = data.replace(/<\/?[a-z]+.*?>/ig, '');
    data = data.replace(/^\s*|\s*$/g, '');
    var root = [];

    var stack = [];
    var alt = [];
    var seq = [];
    var part;
    while(data.length){
        if(part = data.match(
            /^;(([A-Z]{1,2})(\[([^\\\]]|\\\])*\]\s*)+)+/
        )){
            var node = {};
            var sub_part = part[0].match(
                /([A-Z]{1,2})(\[([^\\\]]|\\\])*\]\s*)+/g
            )
            for(var i = 0; i < sub_part.length; i++){
                var pieces = sub_part[i].match(
                    /([A-Z]{1,2})((\[([^\\\]]|\\\])*\]\s*)+)/
                )
                var values = pieces[2].match(/\[([^\\\]]|\\\])*\]/g);
                values = values.map(
                    function(x){return x.replace(/^\[|\]$/g, '')}
                );
                node[pieces[1]] = values;
            }
            seq.push(node);
        }
        else if(part = data.match(/^\(\s*/)){
            if(seq.length){
                alt.push(seq);
                seq = [];
            }
            stack.push(alt);
            alt = [];
        }
        else if(part = data.match(/^\)\s*/)){
            if(seq.length){
                alt.push(seq);
                seq = [];
            }
            var curr_alt = alt;
            alt = stack.pop();
            alt.push(curr_alt);
        }
        data = data.substr(part[0].length);
    }
    return alt[0];
}

function build_board_area(sgf_elem){
    var board_size = sgf_elem.rows;

    var container_elem = document.createElement('div');
    container_elem.classList.add('sgf-container');

    var board_wrapper_elem = document.createElement('div');
    board_wrapper_elem.classList.add('sgf-board-wrapper');

    var board_wrapper_inner_elem = document.createElement('div');
    board_wrapper_inner_elem.classList.add('sgf-board-wrapper-inner');

    var board_elem = document.createElement('div');
    board_elem.classList.add('sgf-board');

    for(var i = 0; i < board_size; i++){
        var row_elem = document.createElement('div');
        row_elem.classList.add('sgf-row');

        for(var j = 0; j < board_size; j++){
            var cell_elem = document.createElement('div');
            cell_elem.classList.add('sgf-cell');

            var point_elem = document.createElement('div');
            point_elem.classList.add('sgf-point');
            point_elem.classList.add('sgf-empty');
            if(HOSHI[board_size] &&
                HOSHI[board_size].indexOf(i * board_size + j) != -1
            ){
                var hoshi_elem = document.createElement('div');
                hoshi_elem.classList.add('sgf-hoshi');
                point_elem.appendChild(hoshi_elem);
            }

            point_elem.color = 0;

            cell_elem.appendChild(point_elem);

            sgf_elem.board[i][j] = point_elem;
            row_elem.appendChild(cell_elem);
        }
        board_elem.appendChild(row_elem);
    }
    board_wrapper_inner_elem.appendChild(board_elem);
    board_wrapper_elem.appendChild(board_wrapper_inner_elem);
    container_elem.appendChild(board_wrapper_elem);

    var buttons_row_elem = document.createElement('div');
    buttons_row_elem.classList.add('sgf-buttons-row');
    var buttons_list = [
        ['sgf-button-start', '<<', 'button_start_elem'],
        ['sgf-button-prev', '<', 'button_prev_elem'],
        ['sgf-button-next', '>', 'button_next_elem'],
        ['sgf-button-end', '>>', 'button_end_elem']
    ]
    for (var i = 0; i < buttons_list.length; i++) {
        var button_elem = document.createElement('div');
        button_elem.classList.add('sgf-button');
        button_elem.classList.add(buttons_list[i][0]);
        button_elem.textContent = buttons_list[i][1];
        buttons_row_elem.appendChild(button_elem);

        sgf_elem[buttons_list[i][2]] = button_elem;

        var button_spacer_elem = document.createTextNode(' ');
        buttons_row_elem.appendChild(button_spacer_elem);
    }
    container_elem.appendChild(buttons_row_elem);

    var comment_elem = document.createElement('div');
    comment_elem.classList.add('sgf-comment');
    sgf_elem.comment_elem = comment_elem;
    container_elem.appendChild(comment_elem);

    sgf_elem.appendChild(container_elem);
}

function show_buttons(sgf_elem, show_prev, show_next) {
    var hide_button_class = 'sgf-button-disabled';
    sgf_elem.button_start_elem.classList
        [show_prev?'remove':'add'](hide_button_class);
    sgf_elem.button_prev_elem.classList
        [show_prev?'remove':'add'](hide_button_class);

    sgf_elem.button_next_elem.classList
        [show_next?'remove':'add'](hide_button_class);
    sgf_elem.button_end_elem.classList
        [show_next?'remove':'add'](hide_button_class);
}

function process_sgf_elem(sgf_elem){
    var data = sgf_elem.getAttribute('data') || sgf_elem.innerHTML;
    var src;
    if(!data && (src = sgf_elem.getAttribute('src'))){
        var xhReq = new XMLHttpRequest();
        xhReq.open("GET", src, false);
        xhReq.send(null);
        var xh_timeout = setTimeout(function(){
            xhReq.abort();
        }, 10000);
        data = xhReq.responseText;
    }

    if (!data){
        return;
    }

    sgf_elem.innerHTML = '';

    try {
        sgf_elem.data = parse_sgf_data(data);
    }
    catch(err) {
        sgf_elem.data = [[{
            'SZ': 19,
            'C': ['An error occured while loading SGF data.'],
        },[]]];
    }

    sgf_elem.rows = sgf_elem.data[0][0]['SZ'] || 19;
    sgf_elem.cols = sgf_elem.data[0][0]['SZ'] || 19;
    sgf_elem.captures = [0, 0];
    sgf_elem.history = [];
    sgf_elem.path = [0, 0];
    sgf_elem.last_move = false;
    sgf_elem.coords = [];

    sgf_elem.board = [];
    for(var i = 0; i < sgf_elem.rows; i++){
        sgf_elem.board.push(new Array(sgf_elem.cols));
    }

    build_board_area(sgf_elem);

    sgf_elem.getElementsByClassName('sgf-button-next')[0]
        .addEventListener(is_mobile?'touchstart':'click',function(e){
            var is_last = next_node(sgf_elem);
            var state = process_node(sgf_elem,
                get_node_by_path(sgf_elem, sgf_elem.path));
            update_elem_from_state(sgf_elem, state);
            show_buttons(sgf_elem, true, !is_last);
        });

    sgf_elem.getElementsByClassName('sgf-button-end')[0]
        .addEventListener(is_mobile?'touchstart':'click',function(e){
            var is_last = false;
            var state;
            while(!is_last){
                is_last = next_node(sgf_elem);
                state = process_node(sgf_elem,
                    get_node_by_path(sgf_elem, sgf_elem.path),
                    state);
            }
            update_elem_from_state(sgf_elem, state);
            show_buttons(sgf_elem, true, false);
        });

    sgf_elem.getElementsByClassName('sgf-button-prev')[0]
        .addEventListener(is_mobile?'touchstart':'click', function(e){
            var is_start = prev_node(sgf_elem);
            var state = sgf_elem.history.pop();
            update_elem_from_state(sgf_elem, state);
            show_buttons(sgf_elem, !is_start, true);
        })

    sgf_elem.getElementsByClassName('sgf-button-start')[0]
        .addEventListener(is_mobile?'touchstart':'click', function(e){
            sgf_elem.captures = [0, 0];
            sgf_elem.history = [];
            sgf_elem.path = [0, 0];
            sgf_elem.last_move = false;
            sgf_elem.coords = [];
            for(var i = 0; i < sgf_elem.rows; i++){
                for(var j = 0; j < sgf_elem.cols; j++){
                    sgf_elem.board[i][j].color = 0;
                }
            }
            var state = process_node(sgf_elem,
                get_node_by_path(sgf_elem, sgf_elem.path));
            update_elem_from_state(sgf_elem, state);
            show_buttons(sgf_elem, false, true);
        })

    var state = process_node(sgf_elem,
        get_node_by_path(sgf_elem, sgf_elem.path));
    update_elem_from_state(sgf_elem, state);
    show_buttons(sgf_elem, false, true);
}

function get_node_by_path(sgf_elem, path){
    var node = sgf_elem.data;
    for(var i = 0; i < path.length; i++){
        node = node[path[i]];
    }
    return node;
}

function next_node(sgf_elem){
    var path = sgf_elem.path;
    var last = path.pop();
    var seq = get_node_by_path(sgf_elem, path);

    if(last == seq.length - 1){
        path.pop();
        path.push(1)
        path.push(0)
        path.push(0)
    }
    else{
        path.push(last + 1);
    }

    last = path[path.length - 1];
    seq = get_node_by_path(sgf_elem, path.slice(0, path.length - 1));
    alt = get_node_by_path(sgf_elem, path.slice(0, path.length - 2));
    return last == seq.length - 1 && alt.length == 1;
}

function prev_node(sgf_elem){
    var path = sgf_elem.path;
    var last = path.pop();
    var node = get_node_by_path(sgf_elem, path);

    if(last == 0){
        path.pop();
        path.pop();
        path.push(0);
        node = get_node_by_path(sgf_elem, path);
        path.push(node.length - 1);
    }
    else{
        path.push(last - 1);
    }
    return arraysEqual(sgf_elem.path, [0, 0]);
}

function coord_to_pos(coord){
    var pos = [0, 0];
    pos[0] = coord.charCodeAt(1) - 97;
    pos[1] = coord.charCodeAt(0) - 97;
    return pos;
}

function human_coord_to_pos(coord){
    var pos = [0, 0];
    pos[0] = 19 - parseInt(coord.substr(1));
    var x = coord.charCodeAt(0) - 65;
    if(x > 26){
        x -= 32;
    }
    if(x > 7){
        x--;
    }
    pos[1] = x;
    return pos;
}

function sgf_elem_to_state(sgf_elem){
    var state = {};
    state.captures = sgf_elem.captures.slice(0);
    state.board = [];
    for(var i = 0; i < sgf_elem.rows; i++){
        state.board.push(new Array(sgf_elem.cols));
        for(var j = 0; j < sgf_elem.cols; j++){
            state.board[i][j] = sgf_elem.board[i][j].color;
        }
    }
    state.last_move = sgf_elem.last_move;
    state.comment = sgf_elem.comment;
    state.coords = sgf_elem.coords;
    return state;
}

function update_elem_from_state(sgf_elem, state){
    var board = state.board;
    var classes = ['sgf-empty', 'sgf-black', 'sgf-white'];
    for(var i = 0; i < sgf_elem.rows; i++){
        for(var j = 0; j < sgf_elem.cols; j++){
            var color = board[i][j];
            var point_elem = sgf_elem.board[i][j];
            point_elem.color = color;
            point_elem.classList.remove(classes[0]);
            point_elem.classList.remove(classes[1]);
            point_elem.classList.remove(classes[2]);
            point_elem.classList.add(classes[color]);
        }
    }
    var last_move_elems = sgf_elem
        .getElementsByClassName('sgf-lastmove');
    if(last_move_elems.length){
        last_move_elems[0].classList.remove('sgf-lastmove');
    }
    sgf_elem.last_move = state.last_move;
    if(sgf_elem.last_move && sgf_elem.last_move != 'pass'){
        var i = sgf_elem.last_move[0];
        var j = sgf_elem.last_move[1];
        sgf_elem.board[i][j].classList.add('sgf-lastmove');
    }

    sgf_elem.captures = state.captures.slice(0);

    sgf_elem.comment = state.comment;
    sgf_elem.comment_elem.textContent = state.comment;

    sgf_elem.coords = state.coords.slice(0);
    var coord_elems = sgf_elem.getElementsByClassName('sgf-coord');
    while(coord_elems.length){
        var coord_elem = coord_elems[0];
        coord_elem.classList.remove('sgf-coord');
        coord_elem.removeAttribute('point-label');
        coord_elems = sgf_elem.getElementsByClassName('sgf-coord');
    }
    for(var n = 0; n < state.coords.length; n++){
        var i = state.coords[n][0][0];
        var j = state.coords[n][0][1];
        var label = state.coords[n][1];
        sgf_elem.board[i][j].classList.add('sgf-coord');
        sgf_elem.board[i][j].setAttribute('point-label', label);
    }
}

function process_node(sgf_elem, node, state){
    if(!state){
        state = sgf_elem_to_state(sgf_elem);
    }
    var clone = JSON.parse(JSON.stringify(state))

    var plan = [[1, 'B'], [1, 'AB'], [2, 'W'], [2, 'AW']];
    var move_count = 0;
    var last_move = false;
    var move_color;
    for (var i = 0; i < plan.length; i++){
        var color = plan[i][0];
        var moves = node[plan[i][1]] || [];
        for (var j = 0; j < moves.length; j++){
            move_color = color;
            var pos = coord_to_pos(moves[j]);
            if (moves[j] == 'tt' || moves[j] == ''){
                last_move = 'pass';
            }
            else{
                play_move(state, color, pos);
                last_move = pos.slice(0);
            }
            move_count ++;
        }
    }

    var capture_info = '' ;
    if (state.captures[0] || state.captures[1]){
        capture_info = 'Captures - White: ' + state.captures[0] +
            ', Black: ' + state.captures[1] + '\n';
    }

    var white_info = '';
    if (node['PW']){
        var rank = node['WR'] && node['WR'][0]?
            ' (' + node['WR'][0] + ')':'';
        white_info = 'White - ' + node['PW'][0] + rank + '\n';
    }

    var black_info = '';
    if (node['PB']){
        var rank = node['BR'] && node['BR'][0]?
            ' (' + node['BR'][0] + ')':'';
        black_info = 'Black - ' + node['PB'][0] + rank + '\n';
    }

    var komi_info = node['KM'] && node['KM'][0]?
        'Komi - ' + node['KM'][0] + '\n': '';

    var handicap_info = node['HA'] && node['HA'][0]?
        'Handicap - ' + node['HA'][0] + '\n': '';

    var result_info = node['RE'] && node['RE'][0]?
        'Result - ' + node['RE'][0] + '\n': '';

    var pass_info = '';
    if (last_move == 'pass') {
        pass_info = (move_color == 1?'Black':'White') + ' passes.\n';
    }

    var comment = node['C'] && node['C'][0] || '';

    state.comment = capture_info + white_info + black_info +
        komi_info + handicap_info + result_info + pass_info +
        comment;

    var coords = [];

    var label_types = [['TR', '\u25B3'], ['SQ', '\u25FB'],
        ['CR', '\u25EF'], ['MA', 'X']];
    for(var i = 0; i < label_types.length; i++){
        var labels = node[label_types[i][0]] || [];
        for (var j = 0; j < labels.length; j++){
            coords.push([
                coord_to_pos(labels[j]),
                label_types[i][1]
            ]);
        }
    }

    var human_coords = comment.match(/\b[a-hj-t]\d{1,2}\b/ig)||[];
    for(var i = 0; i< human_coords.length; i++){
        coords.push([
            human_coord_to_pos(human_coords[i]),
            human_coords[i]
        ]);
    }

    var labels = node['LB'] || [];
    for (var j = 0; j < labels.length; j++){
        coords.push([
            coord_to_pos(labels[j].substr(0, 2)),
            labels[j].substr(3)
        ]);
    }

    state.coords = coords;

    if (move_count == 1){
        state.last_move = last_move;
    }
    sgf_elem.history.push(clone);
    return state;
}

function get_tonari(board, i, j){
    var rows = board.length;
    var cols = board[0].length;
    var tonari = []
    if(i > 0) tonari.push([i - 1, j]);
    if(j > 0) tonari.push([i, j - 1]);
    if(i < rows - 1) tonari.push([i + 1, j]);
    if(j < cols - 1) tonari.push([i, j + 1]);
    return tonari;
}

function has_libs(board, i, j, marks){
    var rows = board.length;
    var cols = board[0].length;
    var color = board[i][j];
    var other;
    if(marks[i * cols + j]){
        return 0;
    }
    marks[i * cols + j] = 1;
    var libs = 0;
    var tonari = get_tonari(board, i, j);
    for(var n = 0; n < tonari.length; n++){
        var t_i = tonari[n][0];
        var t_j = tonari[n][1];
        other = board[t_i][t_j];
        libs |= other?other == color?
            has_libs(board, t_i, t_j, marks):0:1;
    }
    return libs;
}

function remove_marks(board, marks){
    var rows = board.length;
    var cols = board[0].length;
    var count = 0;
    for(var i = 0; i < rows; i++){
        for(var j = 0; j < cols; j++){
            if(marks[i * cols + j]){
                board[i][j] = 0;
                count ++;
            }
        }
    }
    return count;
}

function play_move(state, color, pos){
    var board = state.board;
    var a = pos[0];
    var b = pos[1];
    var rows = board.length;
    var cols = board[0].length;
    if(board[a][b]){
        return 0;
    }
    board[a][b] = color;
    var marks;
    var tonari = get_tonari(board, a, b);
    var kills = 0;
    for(var n = 0; n < tonari.length; n++){
        var t_i = tonari[n][0];
        var t_j = tonari[n][1];
        if(board[t_i][t_j] + color == 3){
            marks = new Array(rows * cols);
            if(!has_libs(board, t_i, t_j, marks)){
                kills += remove_marks(board, marks);
            }
        }
    }
    state.captures[2 - color] += kills;
    return 1;
}

function show_sgf(){
    var sgf_elems = document.getElementsByTagName('SGF');
    for(var i = 0; i < sgf_elems.length; i++){
        process_sgf_elem(sgf_elems[i]);
    }

    sgf_elems = document.getElementsByClassName('sgf');
    for(var i = 0; i < sgf_elems.length; i++){
        process_sgf_elem(sgf_elems[i]);
    }
}

document.addEventListener('DOMContentLoaded', show_sgf, false);

}());
