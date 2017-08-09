function assert(cond, msg){
    if(!cond){
        msg.message = msg
        throw msg
    }
}

function object_map(obj, f){
    let keys = Object.keys(obj)
    return keys.reduce((ret,name,i,keys)=>{
        ret[name] = f(obj[name], name, obj)
        return ret
    }, {})
}

function make_node () {
    return {
        name: 'root',
        status: 0,
        subs: []
    }
}

function normalize(o) {
    if(typeof o === 'string'){
        o = {name: o}
    }

    if(o.parent !== undefined){
        o.from = o.parent
    }

    o.from = o.from || 'root'
    o.subs = o.subs || []

    function merge(a, b){
        a = a || []
        b = b || []
        if(typeof a === 'string'){ a=[a] }
        if(typeof b === 'string'){ b=[b] }
        return [].concat(a, b)
    }
    o.after = merge(o.after, o.next)
    o.before = merge(o.before, o.prev)

    return o
}

function check_unique(o_list){
    let name_lilst = o_list.map(v=>v.name)
    let name_list_unique = Array.from(new Set(name_lilst))
    assert(o_list.length === name_list_unique.length, 'name is not unique')
}

function check_no_free_variable(o_dict){
    function inset(name){
        if(name !== undefined){
            assert(o_dict[name] !== undefined || name === 'root', `${name} is undefined`)
        }
    }
    object_map(o_dict, o=>{
        inset(o.from)
        o.before.map(inset)
        o.after.map(inset)
    })
}

function normalize_dict(o_dict){
    if(o_dict['root'] === undefined){
        o_dict['root'] = {name: 'root', subs: [], before: []}
    }
    object_map(o_dict, (o,k)=>{
        o.from && o_dict[o.from].subs.push(o.name)
        o.after && o.after.map(after=>o_dict[after].before.push(o.name))
    })
    return o_dict
}

function in_array(x, arr){
    return arr.indexOf(x) !== -1
}

function check_no_circle(n_dict, current, path){
    path = path || []
    current = current || 'root'
    assert(!in_array(current, path), `there are dependent circles near ${path} <- ${current}`)
    path.push(current)
    n_dict[current].next.forEach(v=>check_no_circle(n_dict, v, path))
    path.pop()
}

function check_subs_no_circle(o_dict){
    let n_dict = object_map(o_dict, v=>({next: v.subs || []}))
    check_no_circle(n_dict)
}

function check_before_no_circle(o_dict){
    let n_dict = object_map(o_dict, v=>({next: v.before || []}))
    check_no_circle(n_dict)
}

function gen_tree(o_dict) {
    function inner(current, from){
        let current_node = make_node()
        current_node.name = current
        o_dict[current].subs.forEach(v=>inner(v, current_node))
        from.subs.push(current_node)
    }
    let root = {subs: []}
    inner('root', root)
    return root.subs[0]
}

function check_same_level(subs, o_dict){
    let subs_name = subs.map(o=>o.name)
    subs.forEach(
        o=>
            o_dict[o.name].before.forEach(
                n=>
                    assert(in_array(n, subs_name), `${n} not in level ${subs_name}, used by ${o.name}`)
            )
    )
}

function dep_sort(d_dict){
    let ret = []
    function select(){
        for(let i in d_dict){
            if(!d_dict[i].mark){
                return i
            }
        }
        return null
    }
    function visit(current){
        assert(d_dict[current].mark !== 1, `has dependencies circles near ${Object.keys(d_dict)} <- ${current} `)
        if(d_dict[current].mark === 2){ return }
        d_dict[current].mark = 1
        d_dict[current].next.forEach(visit)
        d_dict[current].mark = 2
        ret.push(current)
    }
    while(true){
        let current = select()
        if(current === null){ break }
        visit(current)
    }
    return ret.reverse()
}

function reorder_subs(o_tree, o_dict){
    let subs_o = o_tree.subs
    check_same_level(subs_o, o_dict)
    let d_dist = o_tree.subs.reduce((ret, o)=>{
        ret[o.name] = {next: o_dict[o.name].before}
        return ret
    }, {})
    let sorted = dep_sort(d_dist)
    let subs = sorted.map(name=>o_tree.subs.find(v=>v.name===name))
    o_tree.subs = subs
}

function reorder_tree_subs(o_tree, o_dict){
    reorder_subs(o_tree, o_dict)
    o_tree.subs.forEach(o=>reorder_tree_subs(o, o_dict))
}

function install(...args) {
    let o_list = args.map(normalize)
    check_unique(o_list)
    let o_dict = o_list.reduce((r,v)=>{r[v.name]=v; return r}, {})
    check_no_free_variable(o_dict)
    o_dict = normalize_dict(o_dict)
    check_subs_no_circle(o_dict)
    check_before_no_circle(o_dict)
    let o_tree = gen_tree(o_dict)
    reorder_tree_subs(o_tree, o_dict)
    return o_tree
}

module.exports=install


