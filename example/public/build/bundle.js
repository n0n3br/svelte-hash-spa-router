
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.head.appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error(`Function called outside component initialization`);
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }
    function setContext(key, context) {
        get_current_component().$$.context.set(key, context);
    }
    function getContext(key) {
        return get_current_component().$$.context.get(key);
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if ($$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set() {
            // overridden by instance, if it has props
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.20.1' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev("SvelteDOMInsert", { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev("SvelteDOMInsert", { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev("SvelteDOMRemove", { node });
        detach(node);
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev("SvelteDOMRemoveAttribute", { node, attribute });
        else
            dispatch_dev("SvelteDOMSetAttribute", { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.data === data)
            return;
        dispatch_dev("SvelteDOMSetData", { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* src\Nav.svelte generated by Svelte v3.20.1 */
    const file = "src\\Nav.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[1] = list[i];
    	return child_ctx;
    }

    // (25:6) {#each routes as route}
    function create_each_block(ctx) {
    	let a;
    	let t_value = /*route*/ ctx[1].name + "";
    	let t;
    	let a_href_value;

    	const block = {
    		c: function create() {
    			a = element("a");
    			t = text(t_value);
    			attr_dev(a, "class", "navbar-item");
    			attr_dev(a, "href", a_href_value = "#" + /*route*/ ctx[1].path);
    			add_location(a, file, 25, 8, 563);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, a, anchor);
    			append_dev(a, t);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(a);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(25:6) {#each routes as route}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let nav;
    	let div1;
    	let div0;
    	let t1;
    	let div3;
    	let div2;
    	let each_value = /*routes*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			nav = element("nav");
    			div1 = element("div");
    			div0 = element("div");
    			div0.textContent = "svelte-hash-spa-router";
    			t1 = space();
    			div3 = element("div");
    			div2 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div0, "class", "navbar-item");
    			add_location(div0, file, 20, 4, 400);
    			attr_dev(div1, "class", "navbar-brand");
    			add_location(div1, file, 19, 2, 368);
    			attr_dev(div2, "class", "navbar-end");
    			add_location(div2, file, 23, 4, 498);
    			attr_dev(div3, "class", "navbar-menu svelte-1utiny7");
    			add_location(div3, file, 22, 2, 467);
    			attr_dev(nav, "class", "navbar is-info is-light");
    			attr_dev(nav, "role", "navigation");
    			attr_dev(nav, "aria-label", "main navigation");
    			add_location(nav, file, 15, 0, 271);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, nav, anchor);
    			append_dev(nav, div1);
    			append_dev(div1, div0);
    			append_dev(nav, t1);
    			append_dev(nav, div3);
    			append_dev(div3, div2);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div2, null);
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*routes*/ 1) {
    				each_value = /*routes*/ ctx[0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div2, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(nav);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	const routes = [
    		{ name: "main", path: "/" },
    		{ name: "about", path: "/about" },
    		{ name: "posts", path: "/posts" }
    	];

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Nav> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Nav", $$slots, []);
    	$$self.$capture_state = () => ({ getContext, routes });
    	return [routes];
    }

    class Nav extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Nav",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    /* C:\Users\c134175\projetos\pessoais\svelte-hash-spa-router\src\404.svelte generated by Svelte v3.20.1 */

    const file$1 = "C:\\Users\\c134175\\projetos\\pessoais\\svelte-hash-spa-router\\src\\404.svelte";

    function create_fragment$1(ctx) {
    	let h1;
    	let t1;
    	let h2;
    	let t3;
    	let p;

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			h1.textContent = "404";
    			t1 = space();
    			h2 = element("h2");
    			h2.textContent = "Oops! This Page Could Not Be Found";
    			t3 = space();
    			p = element("p");
    			p.textContent = "Sorry but the page you are lookin for does not exist, have been removed, name\r\n  changed or is temporarily unavailable.";
    			add_location(h1, file$1, 0, 0, 0);
    			add_location(h2, file$1, 1, 0, 14);
    			add_location(p, file$1, 2, 0, 59);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, h2, anchor);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, p, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(h2);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props) {
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<_404> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("_404", $$slots, []);
    	return [];
    }

    class _404 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "_404",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* C:\Users\c134175\projetos\pessoais\svelte-hash-spa-router\src\Router.svelte generated by Svelte v3.20.1 */

    // (64:0) {#if route}
    function create_if_block(ctx) {
    	let switch_instance_anchor;
    	let current;
    	var switch_value = /*route*/ ctx[0].component;

    	function switch_props(ctx) {
    		return {
    			props: {
    				route: /*route*/ ctx[0],
    				params: /*params*/ ctx[1],
    				query: /*query*/ ctx[2]
    			},
    			$$inline: true
    		};
    	}

    	if (switch_value) {
    		var switch_instance = new switch_value(switch_props(ctx));
    	}

    	const block = {
    		c: function create() {
    			if (switch_instance) create_component(switch_instance.$$.fragment);
    			switch_instance_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (switch_instance) {
    				mount_component(switch_instance, target, anchor);
    			}

    			insert_dev(target, switch_instance_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const switch_instance_changes = {};
    			if (dirty & /*route*/ 1) switch_instance_changes.route = /*route*/ ctx[0];
    			if (dirty & /*params*/ 2) switch_instance_changes.params = /*params*/ ctx[1];
    			if (dirty & /*query*/ 4) switch_instance_changes.query = /*query*/ ctx[2];

    			if (switch_value !== (switch_value = /*route*/ ctx[0].component)) {
    				if (switch_instance) {
    					group_outros();
    					const old_component = switch_instance;

    					transition_out(old_component.$$.fragment, 1, 0, () => {
    						destroy_component(old_component, 1);
    					});

    					check_outros();
    				}

    				if (switch_value) {
    					switch_instance = new switch_value(switch_props(ctx));
    					create_component(switch_instance.$$.fragment);
    					transition_in(switch_instance.$$.fragment, 1);
    					mount_component(switch_instance, switch_instance_anchor.parentNode, switch_instance_anchor);
    				} else {
    					switch_instance = null;
    				}
    			} else if (switch_value) {
    				switch_instance.$set(switch_instance_changes);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(switch_instance_anchor);
    			if (switch_instance) destroy_component(switch_instance, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(64:0) {#if route}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let if_block_anchor;
    	let current;
    	let if_block = /*route*/ ctx[0] && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*route*/ ctx[0]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    					transition_in(if_block, 1);
    				} else {
    					if_block = create_if_block(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { routes = [] } = $$props;
    	let path, route, params, query;

    	onMount(() => {
    		if (!window.location.href.includes("/#/")) window.history.pushState("", "", `${window.location.origin}/#/`);

    		if (!routes.find(r => r.name === "404")) routes.push({
    			name: "404",
    			path: "/404",
    			component: _404
    		});

    		update();

    		window.onhashchange = () => {
    			update();
    		};

    		setContext("shsr-routes", routes);
    	});

    	const update = () => {
    		path = window.location.hash.split("?")[0].replace("#", "");

    		$$invalidate(0, route = routes.find(r => {
    			return pathRegex(r.path).test(path);
    		}));

    		$$invalidate(1, params = extractParams());
    		$$invalidate(2, query = extractQuery());
    	}; // setContext("shsr-route", route);

    	const pathRegex = url => {
    		return new RegExp("^" + url.split("&")[0].replace(/\//g, "\\/").replace(/(:\w+)/g, ".") + "$");
    	};

    	const extractParams = () => {
    		if (!route || !path) return {};
    		const routeTokens = route.path.split("/");
    		const urlTokens = path.split("/");

    		return routeTokens.reduce(
    			(m, r, i) => {
    				if (r.includes(":")) m[r.slice(1)] = urlTokens[i];
    				return m;
    			},
    			{}
    		);
    	};

    	const extractQuery = () => {
    		if (!path) return {};
    		let token = window.location.hash.split("?");
    		if (token.length <= 1) return {};

    		return token[1].split("&").reduce(
    			(m, v) => {
    				return { ...m, [v.split("=")[0]]: v.split("=")[1] };
    			},
    			{}
    		);
    	};

    	const writable_props = ["routes"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Router> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Router", $$slots, []);

    	$$self.$set = $$props => {
    		if ("routes" in $$props) $$invalidate(3, routes = $$props.routes);
    	};

    	$$self.$capture_state = () => ({
    		onMount,
    		setContext,
    		Template404: _404,
    		routes,
    		path,
    		route,
    		params,
    		query,
    		update,
    		pathRegex,
    		extractParams,
    		extractQuery
    	});

    	$$self.$inject_state = $$props => {
    		if ("routes" in $$props) $$invalidate(3, routes = $$props.routes);
    		if ("path" in $$props) path = $$props.path;
    		if ("route" in $$props) $$invalidate(0, route = $$props.route);
    		if ("params" in $$props) $$invalidate(1, params = $$props.params);
    		if ("query" in $$props) $$invalidate(2, query = $$props.query);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [route, params, query, routes];
    }

    class Router extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { routes: 3 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Router",
    			options,
    			id: create_fragment$2.name
    		});
    	}

    	get routes() {
    		throw new Error("<Router>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set routes(value) {
    		throw new Error("<Router>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\RouterParams.svelte generated by Svelte v3.20.1 */

    const file$2 = "src\\RouterParams.svelte";

    function create_fragment$3(ctx) {
    	let hr;
    	let t0;
    	let h2;
    	let t2;
    	let pre;
    	let t3_value = JSON.stringify(/*router*/ ctx[0]) + "";
    	let t3;

    	const block = {
    		c: function create() {
    			hr = element("hr");
    			t0 = space();
    			h2 = element("h2");
    			h2.textContent = "The router params are :";
    			t2 = space();
    			pre = element("pre");
    			t3 = text(t3_value);
    			add_location(hr, file$2, 9, 0, 118);
    			attr_dev(h2, "class", "subtitle");
    			add_location(h2, file$2, 10, 0, 126);
    			add_location(pre, file$2, 12, 0, 179);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, hr, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, h2, anchor);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, pre, anchor);
    			append_dev(pre, t3);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*router*/ 1 && t3_value !== (t3_value = JSON.stringify(/*router*/ ctx[0]) + "")) set_data_dev(t3, t3_value);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(hr);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(h2);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(pre);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let { route } = $$props, { params } = $$props, { query } = $$props;
    	const writable_props = ["route", "params", "query"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<RouterParams> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("RouterParams", $$slots, []);

    	$$self.$set = $$props => {
    		if ("route" in $$props) $$invalidate(1, route = $$props.route);
    		if ("params" in $$props) $$invalidate(2, params = $$props.params);
    		if ("query" in $$props) $$invalidate(3, query = $$props.query);
    	};

    	$$self.$capture_state = () => ({ route, params, query, router });

    	$$self.$inject_state = $$props => {
    		if ("route" in $$props) $$invalidate(1, route = $$props.route);
    		if ("params" in $$props) $$invalidate(2, params = $$props.params);
    		if ("query" in $$props) $$invalidate(3, query = $$props.query);
    		if ("router" in $$props) $$invalidate(0, router = $$props.router);
    	};

    	let router;

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*route, params, query*/ 14) {
    			 $$invalidate(0, router = { route, params, query });
    		}
    	};

    	return [router, route, params, query];
    }

    class RouterParams extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, { route: 1, params: 2, query: 3 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "RouterParams",
    			options,
    			id: create_fragment$3.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*route*/ ctx[1] === undefined && !("route" in props)) {
    			console.warn("<RouterParams> was created without expected prop 'route'");
    		}

    		if (/*params*/ ctx[2] === undefined && !("params" in props)) {
    			console.warn("<RouterParams> was created without expected prop 'params'");
    		}

    		if (/*query*/ ctx[3] === undefined && !("query" in props)) {
    			console.warn("<RouterParams> was created without expected prop 'query'");
    		}
    	}

    	get route() {
    		throw new Error("<RouterParams>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set route(value) {
    		throw new Error("<RouterParams>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get params() {
    		throw new Error("<RouterParams>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set params(value) {
    		throw new Error("<RouterParams>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get query() {
    		throw new Error("<RouterParams>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set query(value) {
    		throw new Error("<RouterParams>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\Main.svelte generated by Svelte v3.20.1 */
    const file$3 = "src\\Main.svelte";

    function create_fragment$4(ctx) {
    	let h1;
    	let t1;
    	let current;

    	const routerparams = new RouterParams({
    			props: {
    				route: /*route*/ ctx[0],
    				params: /*params*/ ctx[1],
    				query: /*query*/ ctx[2]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			h1.textContent = "This is the main page";
    			t1 = space();
    			create_component(routerparams.$$.fragment);
    			attr_dev(h1, "class", "title");
    			add_location(h1, file$3, 5, 0, 112);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    			insert_dev(target, t1, anchor);
    			mount_component(routerparams, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const routerparams_changes = {};
    			if (dirty & /*route*/ 1) routerparams_changes.route = /*route*/ ctx[0];
    			if (dirty & /*params*/ 2) routerparams_changes.params = /*params*/ ctx[1];
    			if (dirty & /*query*/ 4) routerparams_changes.query = /*query*/ ctx[2];
    			routerparams.$set(routerparams_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(routerparams.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(routerparams.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    			if (detaching) detach_dev(t1);
    			destroy_component(routerparams, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let { route } = $$props, { params } = $$props, { query } = $$props;
    	const writable_props = ["route", "params", "query"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Main> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Main", $$slots, []);

    	$$self.$set = $$props => {
    		if ("route" in $$props) $$invalidate(0, route = $$props.route);
    		if ("params" in $$props) $$invalidate(1, params = $$props.params);
    		if ("query" in $$props) $$invalidate(2, query = $$props.query);
    	};

    	$$self.$capture_state = () => ({ route, params, query, RouterParams });

    	$$self.$inject_state = $$props => {
    		if ("route" in $$props) $$invalidate(0, route = $$props.route);
    		if ("params" in $$props) $$invalidate(1, params = $$props.params);
    		if ("query" in $$props) $$invalidate(2, query = $$props.query);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [route, params, query];
    }

    class Main extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, { route: 0, params: 1, query: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Main",
    			options,
    			id: create_fragment$4.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*route*/ ctx[0] === undefined && !("route" in props)) {
    			console.warn("<Main> was created without expected prop 'route'");
    		}

    		if (/*params*/ ctx[1] === undefined && !("params" in props)) {
    			console.warn("<Main> was created without expected prop 'params'");
    		}

    		if (/*query*/ ctx[2] === undefined && !("query" in props)) {
    			console.warn("<Main> was created without expected prop 'query'");
    		}
    	}

    	get route() {
    		throw new Error("<Main>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set route(value) {
    		throw new Error("<Main>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get params() {
    		throw new Error("<Main>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set params(value) {
    		throw new Error("<Main>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get query() {
    		throw new Error("<Main>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set query(value) {
    		throw new Error("<Main>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\About.svelte generated by Svelte v3.20.1 */
    const file$4 = "src\\About.svelte";

    function create_fragment$5(ctx) {
    	let h1;
    	let t1;
    	let current;

    	const routerparams = new RouterParams({
    			props: {
    				route: /*route*/ ctx[0],
    				params: /*params*/ ctx[1],
    				query: /*query*/ ctx[2]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			h1.textContent = "This is the about page";
    			t1 = space();
    			create_component(routerparams.$$.fragment);
    			attr_dev(h1, "class", "title");
    			add_location(h1, file$4, 5, 0, 112);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    			insert_dev(target, t1, anchor);
    			mount_component(routerparams, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const routerparams_changes = {};
    			if (dirty & /*route*/ 1) routerparams_changes.route = /*route*/ ctx[0];
    			if (dirty & /*params*/ 2) routerparams_changes.params = /*params*/ ctx[1];
    			if (dirty & /*query*/ 4) routerparams_changes.query = /*query*/ ctx[2];
    			routerparams.$set(routerparams_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(routerparams.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(routerparams.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    			if (detaching) detach_dev(t1);
    			destroy_component(routerparams, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let { route } = $$props, { params } = $$props, { query } = $$props;
    	const writable_props = ["route", "params", "query"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<About> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("About", $$slots, []);

    	$$self.$set = $$props => {
    		if ("route" in $$props) $$invalidate(0, route = $$props.route);
    		if ("params" in $$props) $$invalidate(1, params = $$props.params);
    		if ("query" in $$props) $$invalidate(2, query = $$props.query);
    	};

    	$$self.$capture_state = () => ({ route, params, query, RouterParams });

    	$$self.$inject_state = $$props => {
    		if ("route" in $$props) $$invalidate(0, route = $$props.route);
    		if ("params" in $$props) $$invalidate(1, params = $$props.params);
    		if ("query" in $$props) $$invalidate(2, query = $$props.query);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [route, params, query];
    }

    class About extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, { route: 0, params: 1, query: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "About",
    			options,
    			id: create_fragment$5.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*route*/ ctx[0] === undefined && !("route" in props)) {
    			console.warn("<About> was created without expected prop 'route'");
    		}

    		if (/*params*/ ctx[1] === undefined && !("params" in props)) {
    			console.warn("<About> was created without expected prop 'params'");
    		}

    		if (/*query*/ ctx[2] === undefined && !("query" in props)) {
    			console.warn("<About> was created without expected prop 'query'");
    		}
    	}

    	get route() {
    		throw new Error("<About>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set route(value) {
    		throw new Error("<About>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get params() {
    		throw new Error("<About>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set params(value) {
    		throw new Error("<About>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get query() {
    		throw new Error("<About>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set query(value) {
    		throw new Error("<About>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\Posts.svelte generated by Svelte v3.20.1 */
    const file$5 = "src\\Posts.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[4] = list[i];
    	return child_ctx;
    }

    // (15:6) {#each posts as post}
    function create_each_block$1(ctx) {
    	let div;
    	let a;
    	let t0_value = /*post*/ ctx[4].description + "";
    	let t0;
    	let a_href_value;
    	let t1;

    	const block = {
    		c: function create() {
    			div = element("div");
    			a = element("a");
    			t0 = text(t0_value);
    			t1 = space();
    			attr_dev(a, "href", a_href_value = `#/post/${/*post*/ ctx[4].id}`);
    			add_location(a, file$5, 16, 10, 529);
    			attr_dev(div, "class", "panel-block has-text-centered");
    			add_location(div, file$5, 15, 8, 474);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, a);
    			append_dev(a, t0);
    			append_dev(div, t1);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(15:6) {#each posts as post}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$6(ctx) {
    	let h1;
    	let t1;
    	let div3;
    	let div2;
    	let div1;
    	let div0;
    	let t3;
    	let t4;
    	let current;
    	let each_value = /*posts*/ ctx[3];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const routerparams = new RouterParams({
    			props: {
    				route: /*route*/ ctx[0],
    				params: /*params*/ ctx[1],
    				query: /*query*/ ctx[2]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			h1.textContent = "This is the posts page";
    			t1 = space();
    			div3 = element("div");
    			div2 = element("div");
    			div1 = element("div");
    			div0 = element("div");
    			div0.textContent = "Posts List";
    			t3 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t4 = space();
    			create_component(routerparams.$$.fragment);
    			attr_dev(h1, "class", "title");
    			add_location(h1, file$5, 9, 0, 234);
    			attr_dev(div0, "class", "panel-heading");
    			add_location(div0, file$5, 13, 6, 392);
    			attr_dev(div1, "class", "panel");
    			add_location(div1, file$5, 12, 4, 365);
    			attr_dev(div2, "class", "column is-one-third is-offset-one-third");
    			add_location(div2, file$5, 11, 2, 306);
    			attr_dev(div3, "class", "columns");
    			add_location(div3, file$5, 10, 0, 281);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, div3, anchor);
    			append_dev(div3, div2);
    			append_dev(div2, div1);
    			append_dev(div1, div0);
    			append_dev(div1, t3);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div1, null);
    			}

    			insert_dev(target, t4, anchor);
    			mount_component(routerparams, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*posts*/ 8) {
    				each_value = /*posts*/ ctx[3];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div1, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			const routerparams_changes = {};
    			if (dirty & /*route*/ 1) routerparams_changes.route = /*route*/ ctx[0];
    			if (dirty & /*params*/ 2) routerparams_changes.params = /*params*/ ctx[1];
    			if (dirty & /*query*/ 4) routerparams_changes.query = /*query*/ ctx[2];
    			routerparams.$set(routerparams_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(routerparams.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(routerparams.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(div3);
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(t4);
    			destroy_component(routerparams, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props, $$invalidate) {
    	let { route } = $$props, { params } = $$props, { query } = $$props;

    	const posts = [...Array(10).keys()].map(key => ({
    		id: key,
    		description: "post number " + String(key)
    	}));

    	const writable_props = ["route", "params", "query"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Posts> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Posts", $$slots, []);

    	$$self.$set = $$props => {
    		if ("route" in $$props) $$invalidate(0, route = $$props.route);
    		if ("params" in $$props) $$invalidate(1, params = $$props.params);
    		if ("query" in $$props) $$invalidate(2, query = $$props.query);
    	};

    	$$self.$capture_state = () => ({
    		route,
    		params,
    		query,
    		RouterParams,
    		posts
    	});

    	$$self.$inject_state = $$props => {
    		if ("route" in $$props) $$invalidate(0, route = $$props.route);
    		if ("params" in $$props) $$invalidate(1, params = $$props.params);
    		if ("query" in $$props) $$invalidate(2, query = $$props.query);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [route, params, query, posts];
    }

    class Posts extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, { route: 0, params: 1, query: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Posts",
    			options,
    			id: create_fragment$6.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*route*/ ctx[0] === undefined && !("route" in props)) {
    			console.warn("<Posts> was created without expected prop 'route'");
    		}

    		if (/*params*/ ctx[1] === undefined && !("params" in props)) {
    			console.warn("<Posts> was created without expected prop 'params'");
    		}

    		if (/*query*/ ctx[2] === undefined && !("query" in props)) {
    			console.warn("<Posts> was created without expected prop 'query'");
    		}
    	}

    	get route() {
    		throw new Error("<Posts>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set route(value) {
    		throw new Error("<Posts>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get params() {
    		throw new Error("<Posts>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set params(value) {
    		throw new Error("<Posts>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get query() {
    		throw new Error("<Posts>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set query(value) {
    		throw new Error("<Posts>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\Post.svelte generated by Svelte v3.20.1 */
    const file$6 = "src\\Post.svelte";

    function create_fragment$7(ctx) {
    	let h1;
    	let t0;
    	let t1_value = /*params*/ ctx[0].id + "";
    	let t1;
    	let t2;
    	let t3;
    	let a;
    	let t5;
    	let current;

    	const routerparams = new RouterParams({
    			props: {
    				route: /*route*/ ctx[2],
    				query: /*query*/ ctx[1],
    				params: /*params*/ ctx[0]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			t0 = text("This is the post number ");
    			t1 = text(t1_value);
    			t2 = text(" page");
    			t3 = space();
    			a = element("a");
    			a.textContent = "Go Back";
    			t5 = space();
    			create_component(routerparams.$$.fragment);
    			attr_dev(h1, "class", "title");
    			add_location(h1, file$6, 5, 0, 112);
    			attr_dev(a, "href", "#/posts");
    			add_location(a, file$6, 6, 0, 177);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    			append_dev(h1, t0);
    			append_dev(h1, t1);
    			append_dev(h1, t2);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, a, anchor);
    			insert_dev(target, t5, anchor);
    			mount_component(routerparams, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if ((!current || dirty & /*params*/ 1) && t1_value !== (t1_value = /*params*/ ctx[0].id + "")) set_data_dev(t1, t1_value);
    			const routerparams_changes = {};
    			if (dirty & /*route*/ 4) routerparams_changes.route = /*route*/ ctx[2];
    			if (dirty & /*query*/ 2) routerparams_changes.query = /*query*/ ctx[1];
    			if (dirty & /*params*/ 1) routerparams_changes.params = /*params*/ ctx[0];
    			routerparams.$set(routerparams_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(routerparams.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(routerparams.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(a);
    			if (detaching) detach_dev(t5);
    			destroy_component(routerparams, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$7($$self, $$props, $$invalidate) {
    	let { params } = $$props, { query } = $$props, { route } = $$props;
    	const writable_props = ["params", "query", "route"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Post> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Post", $$slots, []);

    	$$self.$set = $$props => {
    		if ("params" in $$props) $$invalidate(0, params = $$props.params);
    		if ("query" in $$props) $$invalidate(1, query = $$props.query);
    		if ("route" in $$props) $$invalidate(2, route = $$props.route);
    	};

    	$$self.$capture_state = () => ({ params, query, route, RouterParams });

    	$$self.$inject_state = $$props => {
    		if ("params" in $$props) $$invalidate(0, params = $$props.params);
    		if ("query" in $$props) $$invalidate(1, query = $$props.query);
    		if ("route" in $$props) $$invalidate(2, route = $$props.route);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [params, query, route];
    }

    class Post extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, { params: 0, query: 1, route: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Post",
    			options,
    			id: create_fragment$7.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*params*/ ctx[0] === undefined && !("params" in props)) {
    			console.warn("<Post> was created without expected prop 'params'");
    		}

    		if (/*query*/ ctx[1] === undefined && !("query" in props)) {
    			console.warn("<Post> was created without expected prop 'query'");
    		}

    		if (/*route*/ ctx[2] === undefined && !("route" in props)) {
    			console.warn("<Post> was created without expected prop 'route'");
    		}
    	}

    	get params() {
    		throw new Error("<Post>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set params(value) {
    		throw new Error("<Post>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get query() {
    		throw new Error("<Post>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set query(value) {
    		throw new Error("<Post>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get route() {
    		throw new Error("<Post>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set route(value) {
    		throw new Error("<Post>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\Router.svelte generated by Svelte v3.20.1 */

    function create_fragment$8(ctx) {
    	let current;

    	const router = new Router({
    			props: { routes: /*routes*/ ctx[0] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(router.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(router, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(router.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(router.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(router, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$8.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$8($$self, $$props, $$invalidate) {
    	const routes = [
    		{ name: "main", path: "/", component: Main },
    		{
    			name: "about",
    			path: "/about",
    			component: About
    		},
    		{
    			name: "posts",
    			path: "/posts",
    			component: Posts
    		},
    		{
    			name: "post",
    			path: "/post/:id",
    			component: Post
    		}
    	];

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Router> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Router", $$slots, []);
    	$$self.$capture_state = () => ({ Router, Main, About, Posts, Post, routes });
    	return [routes];
    }

    class Router_1 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$8, create_fragment$8, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Router_1",
    			options,
    			id: create_fragment$8.name
    		});
    	}
    }

    /* src\App.svelte generated by Svelte v3.20.1 */
    const file$7 = "src\\App.svelte";

    function create_fragment$9(ctx) {
    	let main;
    	let t;
    	let div2;
    	let div1;
    	let div0;
    	let current;
    	const nav = new Nav({ $$inline: true });
    	const router = new Router_1({ $$inline: true });

    	const block = {
    		c: function create() {
    			main = element("main");
    			create_component(nav.$$.fragment);
    			t = space();
    			div2 = element("div");
    			div1 = element("div");
    			div0 = element("div");
    			create_component(router.$$.fragment);
    			attr_dev(div0, "class", "container has-text-centered");
    			add_location(div0, file$7, 9, 6, 192);
    			attr_dev(div1, "class", "hero-body");
    			add_location(div1, file$7, 8, 4, 162);
    			attr_dev(div2, "class", "hero is-fullheight-with-navbar");
    			add_location(div2, file$7, 7, 2, 113);
    			add_location(main, file$7, 5, 0, 94);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			mount_component(nav, main, null);
    			append_dev(main, t);
    			append_dev(main, div2);
    			append_dev(div2, div1);
    			append_dev(div1, div0);
    			mount_component(router, div0, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(nav.$$.fragment, local);
    			transition_in(router.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(nav.$$.fragment, local);
    			transition_out(router.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_component(nav);
    			destroy_component(router);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$9.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$9($$self, $$props, $$invalidate) {
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("App", $$slots, []);
    	$$self.$capture_state = () => ({ Nav, Router: Router_1 });
    	return [];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$9, create_fragment$9, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$9.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {
    		name: 'world'
    	}
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
