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
    return alt[0][0];
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
            if(HOSHI[board_size] &&
                HOSHI[board_size].indexOf(i * board_size + j) != -1
            ){
                var hoshi_elem = document.createElement('div');
                hoshi_elem.classList.add('sgf-hoshi');
                point_elem.appendChild(hoshi_elem);
            }

            cell_elem.appendChild(point_elem);

            sgf_elem.board[i][j] = point_elem;
            row_elem.appendChild(cell_elem);
        }
        board_elem.appendChild(row_elem);
    }
    board_wrapper_inner_elem.appendChild(board_elem);
    board_wrapper_elem.appendChild(board_wrapper_inner_elem);
    container_elem.appendChild(board_wrapper_elem);
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
    sgf_elem.rows = sgf_elem.data[0]['SZ'] || 19;
    sgf_elem.cols = sgf_elem.data[0]['SZ'] || 19;

    console.log(sgf_elem.data);

    sgf_elem.board = [];
    for(var i = 0; i < sgf_elem.rows; i++){
        sgf_elem.board.push(new Array(sgf_elem.cols));
    }

    build_board_area(sgf_elem);
}

function show_sgf(){
    var sgf_elems = document.getElementsByTagName('SGF');
    for(var i = 0; i < sgf_elems.length; i++){
        process_sgf_elem(sgf_elems[i]);
    }
}

document.addEventListener('DOMContentLoaded', show_sgf, false);

}());
