(function(){

var HOSHI = {
    9: [20, 24, 40, 56, 60],
    13: [42, 48, 84, 120, 126],
    19: [60, 66, 72, 174, 180, 186, 288, 294, 300]
}

function parse_sgf_data(data){
    //data = data.replace(/^\s*[(]?|[)]?\s*$/g,'');
    data = data.replace(/^\s*|\s*$/g,'');
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
        else{
            console.error(data);
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
            point_elem.classList.add('sgf-point', 'sgf-empty');
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
        ['sgf-button-start', '<<'],
        ['sgf-button-prev', '<'],
        ['sgf-button-next', '>'],
        ['sgf-button-end', '>>']
    ]
    for (var i = 0; i < buttons_list.length; i++) {
        var button_elem = document.createElement('div');
        button_elem.classList.add('sgf-button', buttons_list[i][0]);
        button_elem.innerText = buttons_list[i][1];
        buttons_row_elem.appendChild(button_elem);

        var button_spacer_elem = document.createTextNode(' ');
        buttons_row_elem.appendChild(button_spacer_elem);
    }
    container_elem.appendChild(buttons_row_elem);

    var info_elem = document.createElement('div');
    info_elem.classList.add('sgf-info');
    container_elem.appendChild(info_elem);

    sgf_elem.appendChild(container_elem);
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
    sgf_elem.data = parse_sgf_data(data);
    sgf_elem.rows = sgf_elem.data[0][0]['SZ'] || 19;
    sgf_elem.cols = sgf_elem.data[0][0]['SZ'] || 19;
    sgf_elem.captures = [0, 0];
    sgf_elem.history = [];
    sgf_elem.path = [0, 0];
    sgf_elem.last_move = false;

    sgf_elem.board = [];
    for(var i = 0; i < sgf_elem.rows; i++){
        sgf_elem.board.push(new Array(sgf_elem.cols));
    }

    build_board_area(sgf_elem);

    sgf_elem.getElementsByClassName('sgf-button-next')[0]
        .addEventListener('click', function(e){
            next_node(sgf_elem);
            process_node(sgf_elem, get_current_node(sgf_elem));
        })
    process_node(sgf_elem, get_current_node(sgf_elem));
}

function get_current_node(sgf_elem){
    var node = sgf_elem.data;
    for(var i = 0; i < sgf_elem.path.length; i++){
        node = node[sgf_elem.path[i]];
    }
    return node;
}

function next_node(sgf_elem){
    var path = sgf_elem.path;
    var last = path.pop();
    var node = get_current_node(sgf_elem);

    while(true){
        if(last >= node.length){
            last = path.pop();
            node = get_current_node(sgf_elem);
        }
        else{
            path.push(last + 1);
            return '';
        }
    }
}

function coord_to_pos(coord){
    var pos = [0, 0];
    pos[0] = coord.charCodeAt(1) - 97;
    pos[1] = coord.charCodeAt(0) - 97;
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
    if(sgf_elem.last_move){
        var i = sgf_elem.last_move[0];
        var j = sgf_elem.last_move[1];
        sgf_elem.board[i][j].classList.remove('sgf-lastmove');
    }
    sgf_elem.last_move = state.last_move;
    if(sgf_elem.last_move){
        var i = sgf_elem.last_move[0];
        var j = sgf_elem.last_move[1];
        sgf_elem.board[i][j].classList.add('sgf-lastmove');
    }
}

function process_node(sgf_elem, node){
    var state = sgf_elem_to_state(sgf_elem);
    var clone = JSON.parse(JSON.stringify(state))

    var plan = [[1, 'B'], [1, 'AB'], [2, 'W'], [2, 'AW']];
    var move_count = 0;
    var last_move = false;
    for (var i = 0; i < plan.length; i++){
        var color = plan[i][0];
        var moves = node[plan[i][1]] || [];
        for (var j = 0; j < moves.length; j++){
            var pos = coord_to_pos(moves[j]);
            play_move(state, color, pos);
            move_count ++;
            last_move = pos.slice(0);
        }
    }
    if (move_count == 1){
        state.last_move = last_move;
    }
    sgf_elem.history.push(clone);
    update_elem_from_state(sgf_elem, state);
}

function has_libs(board, i, j, rows, cols, marks){
    var color = board[i][j];
    var other;
    if(marks[i * cols + j]){
        return 0;
    }
    marks[i * cols + j] = 1;
    var libs = 0;
    if(i > 0){
        other = board[i - 1][j];
        libs |= other?other == color?
            has_libs(board, i - 1, j, rows, cols, marks):0:1;
    }
    if(j > 0){
        other = board[i][j - 1];
        libs |= other?other == color?
            has_libs(board, i, j - 1, rows, cols, marks):0:1;
    }
    if(i < rows - 1){
        other = board[i + 1][j];
        libs |= other?other == color?
            has_libs(board, i + 1, j, rows, cols, marks):0:1;
    }
    if(j < cols - 1){
        other = board[i][j + 1];
        libs |= other?other == color?
            has_libs(board, i, j + 1, rows, cols, marks):0:1;
    }
    return libs;
}

function remove_marks(board, rows, cols, marks){
    for(var i = 0; i < rows; i++){
        for(var j = 0; j < cols; j++){
            if(marks[i * cols + j]){
                board[i][j] = 0;
            }
        }
    }
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
    var libs;
    if(a > 0 && board[a - 1][b] + color == 3){
        marks = new Array(rows * cols);
        libs = has_libs(board, a - 1, b, rows, cols, marks);
        if(!libs){
            remove_marks(board, rows, cols, marks);
        }
    }
    if(b > 0 && board[a][b - 1] + color == 3){
        marks = new Array(rows * cols);
        libs = has_libs(board, a, b - 1, rows, cols, marks);
        if(!libs){
            remove_marks(board, rows, cols, marks);
        }
    }
    if(a < rows - 1 && board[a + 1][b] + color == 3){
        marks = new Array(rows * cols);
        libs = has_libs(board, a + 1, b, rows, cols, marks);
        if(!libs){
            remove_marks(board, rows, cols, marks);
        }
    }
    if(b < cols - 1 && board[a][b + 1] + color == 3){
        marks = new Array(rows * cols);
        libs = has_libs(board, a, b + 1, rows, cols, marks);
        if(!libs){
            remove_marks(board, rows, cols, marks);
        }
    }
}

function show_sgf(){
    var sgf_elems = document.getElementsByTagName('SGF');
    for(var i = 0; i < sgf_elems.length; i++){
        process_sgf_elem(sgf_elems[i]);
    }
}

document.addEventListener('DOMContentLoaded', show_sgf, false);

}());
