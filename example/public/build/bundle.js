
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.head.appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
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
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function get_store_value(store) {
        let value;
        subscribe(store, _ => value = _)();
        return value;
    }
    function create_slot(definition, ctx, $$scope, fn) {
        if (definition) {
            const slot_ctx = get_slot_context(definition, ctx, $$scope, fn);
            return definition[0](slot_ctx);
        }
    }
    function get_slot_context(definition, ctx, $$scope, fn) {
        return definition[1] && fn
            ? assign($$scope.ctx.slice(), definition[1](fn(ctx)))
            : $$scope.ctx;
    }
    function get_slot_changes(definition, $$scope, dirty, fn) {
        if (definition[2] && fn) {
            const lets = definition[2](fn(dirty));
            if ($$scope.dirty === undefined) {
                return lets;
            }
            if (typeof lets === 'object') {
                const merged = [];
                const len = Math.max($$scope.dirty.length, lets.length);
                for (let i = 0; i < len; i += 1) {
                    merged[i] = $$scope.dirty[i] | lets[i];
                }
                return merged;
            }
            return $$scope.dirty | lets;
        }
        return $$scope.dirty;
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
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
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

    const globals = (typeof window !== 'undefined' ? window : global);
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
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ["capture"] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev("SvelteDOMAddEventListener", { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev("SvelteDOMRemoveEventListener", { node, event, handler, modifiers });
            dispose();
        };
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

    const subscriber_queue = [];
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = [];
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (let i = 0; i < subscribers.length; i += 1) {
                        const s = subscribers[i];
                        s[1]();
                        subscriber_queue.push(s, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.push(subscriber);
            if (subscribers.length === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                const index = subscribers.indexOf(subscriber);
                if (index !== -1) {
                    subscribers.splice(index, 1);
                }
                if (subscribers.length === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }

    /* C:\Users\c134175\projetos\pessoais\svelte-hash-spa-router\src\404.svelte generated by Svelte v3.20.1 */

    const file = "C:\\Users\\c134175\\projetos\\pessoais\\svelte-hash-spa-router\\src\\404.svelte";

    function create_fragment(ctx) {
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
    			add_location(h1, file, 0, 0, 0);
    			add_location(h2, file, 1, 0, 14);
    			add_location(p, file, 2, 0, 59);
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
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props) {
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
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "_404",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    /* C:\Users\c134175\projetos\pessoais\svelte-hash-spa-router\src\Error.svelte generated by Svelte v3.20.1 */

    const { Error: Error_1 } = globals;
    const file$1 = "C:\\Users\\c134175\\projetos\\pessoais\\svelte-hash-spa-router\\src\\Error.svelte";

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
    			h2.textContent = "Oops! There's an error in svelte-hash-spa-router";
    			t3 = space();
    			p = element("p");
    			p.textContent = "Please reload the page";
    			add_location(h1, file$1, 0, 0, 0);
    			add_location(h2, file$1, 1, 0, 14);
    			add_location(p, file$1, 2, 0, 73);
    		},
    		l: function claim(nodes) {
    			throw new Error_1("options.hydrate only works if the component was compiled with the `hydratable: true` option");
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
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Error> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Error", $$slots, []);
    	return [];
    }

    class Error$1 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Error",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* C:\Users\c134175\projetos\pessoais\svelte-hash-spa-router\src\Router.svelte generated by Svelte v3.20.1 */

    // (87:0) {:else}
    function create_else_block(ctx) {
    	let current;
    	const templateerror = new Error$1({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(templateerror.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(templateerror, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(templateerror.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(templateerror.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(templateerror, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(87:0) {:else}",
    		ctx
    	});

    	return block;
    }

    // (81:0) {#if route}
    function create_if_block(ctx) {
    	let switch_instance_anchor;
    	let current;
    	var switch_value = /*route*/ ctx[0].component;

    	function switch_props(ctx) {
    		return {
    			props: {
    				route: {
    					path: /*route*/ ctx[0].path,
    					name: /*route*/ ctx[0].name
    				},
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

    			if (dirty & /*route*/ 1) switch_instance_changes.route = {
    				path: /*route*/ ctx[0].path,
    				name: /*route*/ ctx[0].name
    			};

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
    		source: "(81:0) {#if route}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block, create_else_block];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*route*/ ctx[0]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				}

    				transition_in(if_block, 1);
    				if_block.m(if_block_anchor.parentNode, if_block_anchor);
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
    			if_blocks[current_block_type_index].d(detaching);
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

    const routerStore = writable({
    	routes: [],
    	route: {},
    	query: {},
    	params: {}
    });

    const store = { subscribe: routerStore.subscribe };

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

    		routerStore.update(state => ({
    			...state,
    			routes: routes.map(r => ({ name: r.name, path: r.path }))
    		}));

    		update();

    		window.onhashchange = () => {
    			update();
    		};
    	});

    	const update = () => {
    		path = window.location.hash.split("?")[0].replace("#", "");

    		$$invalidate(0, route = routes.find(r => {
    			return pathRegex(r.path).test(path);
    		}));

    		if (!route) {
    			history.replaceState({}, {}, "#/404");
    		}

    		$$invalidate(1, params = extractParams());
    		$$invalidate(2, query = extractQuery());
    		routerStore.update(state => ({ ...state, route, params, query }));
    	};

    	const pathRegex = url => {
    		return new RegExp("^" + url.split("?")[0].replace(/\//g, "\\/").replace(/(:\w+)/g, ".") + "$");
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
    		writable,
    		routerStore,
    		store,
    		onMount,
    		Template404: _404,
    		TemplateError: Error$1,
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

    const makeHash = (route, params) =>
      !route.path
        ? ""
        : route.path
            .split("/")
            .map((r) => {
              if (!r.length) return "";
              if (r.slice(0, 1) != ":") return r;
              if (!params[r.slice(1)]) {
                throw new Error(
                  `svelte-hash-spa-router : route ${
                route.name || route.path
              } expects param ${r.slice(1)} to be defined`
                );
              }
              return params[r.slice(1)];
            })
            .join("/");

    const makeQuery = (query) =>
      !Object.keys(query).length
        ? ""
        : "?" +
          Object.keys(query)
            .map((key) => key + "=" + query[key])
            .join("&");

    /* C:\Users\c134175\projetos\pessoais\svelte-hash-spa-router\src\Link.svelte generated by Svelte v3.20.1 */

    const { Error: Error_1$1 } = globals;
    const file$2 = "C:\\Users\\c134175\\projetos\\pessoais\\svelte-hash-spa-router\\src\\Link.svelte";

    function create_fragment$3(ctx) {
    	let a;
    	let a_href_value;
    	let current;
    	const default_slot_template = /*$$slots*/ ctx[13].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[12], null);

    	const block = {
    		c: function create() {
    			a = element("a");
    			if (default_slot) default_slot.c();
    			attr_dev(a, "href", a_href_value = "#" + makeHash(/*linkRoute*/ ctx[2], /*params*/ ctx[0]) + makeQuery(/*query*/ ctx[1]));
    			attr_dev(a, "class", /*completeClassName*/ ctx[3]);
    			add_location(a, file$2, 38, 0, 1015);
    		},
    		l: function claim(nodes) {
    			throw new Error_1$1("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, a, anchor);

    			if (default_slot) {
    				default_slot.m(a, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 4096) {
    					default_slot.p(get_slot_context(default_slot_template, ctx, /*$$scope*/ ctx[12], null), get_slot_changes(default_slot_template, /*$$scope*/ ctx[12], dirty, null));
    				}
    			}

    			if (!current || dirty & /*linkRoute, params, query*/ 7 && a_href_value !== (a_href_value = "#" + makeHash(/*linkRoute*/ ctx[2], /*params*/ ctx[0]) + makeQuery(/*query*/ ctx[1]))) {
    				attr_dev(a, "href", a_href_value);
    			}

    			if (!current || dirty & /*completeClassName*/ 8) {
    				attr_dev(a, "class", /*completeClassName*/ ctx[3]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(a);
    			if (default_slot) default_slot.d(detaching);
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
    	let { to = "" } = $$props,
    		{ params = {} } = $$props,
    		{ query = {} } = $$props,
    		{ config = {} } = $$props,
    		{ match = false } = $$props;

    	let routes = [],
    		currentRoute = {},
    		className = "",
    		activeClassName = "",
    		linkRoute = {};

    	onMount(() => {
    		$$invalidate(9, className = config.class || "");
    		$$invalidate(10, activeClassName = config.activeClass || "active");
    		if (!to) throw new Error("svelte-hash-spa-router Link component expects 'to' to be defined");
    	});

    	store.subscribe(state => {
    		$$invalidate(7, routes = state.routes);
    		$$invalidate(8, currentRoute = state.route);
    	});

    	const writable_props = ["to", "params", "query", "config", "match"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Link> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Link", $$slots, ['default']);

    	$$self.$set = $$props => {
    		if ("to" in $$props) $$invalidate(4, to = $$props.to);
    		if ("params" in $$props) $$invalidate(0, params = $$props.params);
    		if ("query" in $$props) $$invalidate(1, query = $$props.query);
    		if ("config" in $$props) $$invalidate(5, config = $$props.config);
    		if ("match" in $$props) $$invalidate(6, match = $$props.match);
    		if ("$$scope" in $$props) $$invalidate(12, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		onMount,
    		store,
    		makeHash,
    		makeQuery,
    		to,
    		params,
    		query,
    		config,
    		match,
    		routes,
    		currentRoute,
    		className,
    		activeClassName,
    		linkRoute,
    		active,
    		completeClassName
    	});

    	$$self.$inject_state = $$props => {
    		if ("to" in $$props) $$invalidate(4, to = $$props.to);
    		if ("params" in $$props) $$invalidate(0, params = $$props.params);
    		if ("query" in $$props) $$invalidate(1, query = $$props.query);
    		if ("config" in $$props) $$invalidate(5, config = $$props.config);
    		if ("match" in $$props) $$invalidate(6, match = $$props.match);
    		if ("routes" in $$props) $$invalidate(7, routes = $$props.routes);
    		if ("currentRoute" in $$props) $$invalidate(8, currentRoute = $$props.currentRoute);
    		if ("className" in $$props) $$invalidate(9, className = $$props.className);
    		if ("activeClassName" in $$props) $$invalidate(10, activeClassName = $$props.activeClassName);
    		if ("linkRoute" in $$props) $$invalidate(2, linkRoute = $$props.linkRoute);
    		if ("active" in $$props) $$invalidate(11, active = $$props.active);
    		if ("completeClassName" in $$props) $$invalidate(3, completeClassName = $$props.completeClassName);
    	};

    	let active;
    	let completeClassName;

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*routes, to*/ 144) {
    			 $$invalidate(2, linkRoute = routes.find(r => r.name === to || r.path === to) || {});
    		}

    		if ($$self.$$.dirty & /*linkRoute, currentRoute, match*/ 324) {
    			 $$invalidate(11, active = linkRoute.path === currentRoute.path || linkRoute.name === currentRoute.name || match && currentRoute.path.match(match));
    		}

    		if ($$self.$$.dirty & /*className, active, activeClassName*/ 3584) {
    			 $$invalidate(3, completeClassName = className + (active ? " " + activeClassName : ""));
    		}
    	};

    	return [
    		params,
    		query,
    		linkRoute,
    		completeClassName,
    		to,
    		config,
    		match,
    		routes,
    		currentRoute,
    		className,
    		activeClassName,
    		active,
    		$$scope,
    		$$slots
    	];
    }

    class Link extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {
    			to: 4,
    			params: 0,
    			query: 1,
    			config: 5,
    			match: 6
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Link",
    			options,
    			id: create_fragment$3.name
    		});
    	}

    	get to() {
    		throw new Error_1$1("<Link>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set to(value) {
    		throw new Error_1$1("<Link>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get params() {
    		throw new Error_1$1("<Link>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set params(value) {
    		throw new Error_1$1("<Link>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get query() {
    		throw new Error_1$1("<Link>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set query(value) {
    		throw new Error_1$1("<Link>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get config() {
    		throw new Error_1$1("<Link>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set config(value) {
    		throw new Error_1$1("<Link>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get match() {
    		throw new Error_1$1("<Link>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set match(value) {
    		throw new Error_1$1("<Link>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    var navigate = (to, params = {}, query = {}) => {
      if (!to)
        throw new Error(
          "svelte-hash-spa-router navigate method expects 'to' to be defined"
        );
      const routes = get_store_value(store).routes;
      const route = routes.find((r) => r.name === to || r.path === to) || {};
      if (!route)
        throw new Error(`svelte-hash-spa-router route '${to}' is not valid`);
      location.hash = "#" + makeHash(route, params) + makeQuery(query);
    };

    /* src\Nav.svelte generated by Svelte v3.20.1 */
    const file$3 = "src\\Nav.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[1] = list[i];
    	return child_ctx;
    }

    // (26:8) <Link            to={route.path}            config={{ class: 'navbar-item', activeClass: 'is-active' }}            match={route.match}            query={route.query}>
    function create_default_slot(ctx) {
    	let t0_value = /*route*/ ctx[1].name + "";
    	let t0;
    	let t1;

    	const block = {
    		c: function create() {
    			t0 = text(t0_value);
    			t1 = space();
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t0, anchor);
    			insert_dev(target, t1, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(t1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot.name,
    		type: "slot",
    		source: "(26:8) <Link            to={route.path}            config={{ class: 'navbar-item', activeClass: 'is-active' }}            match={route.match}            query={route.query}>",
    		ctx
    	});

    	return block;
    }

    // (25:6) {#each routes as route}
    function create_each_block(ctx) {
    	let current;

    	const link = new Link({
    			props: {
    				to: /*route*/ ctx[1].path,
    				config: {
    					class: "navbar-item",
    					activeClass: "is-active"
    				},
    				match: /*route*/ ctx[1].match,
    				query: /*route*/ ctx[1].query,
    				$$slots: { default: [create_default_slot] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(link.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(link, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const link_changes = {};

    			if (dirty & /*$$scope*/ 16) {
    				link_changes.$$scope = { dirty, ctx };
    			}

    			link.$set(link_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(link.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(link.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(link, detaching);
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

    function create_fragment$4(ctx) {
    	let nav;
    	let div1;
    	let div0;
    	let t1;
    	let div3;
    	let div2;
    	let current;
    	let each_value = /*routes*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

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
    			add_location(div0, file$3, 20, 4, 462);
    			attr_dev(div1, "class", "navbar-brand");
    			add_location(div1, file$3, 19, 2, 430);
    			attr_dev(div2, "class", "navbar-end");
    			add_location(div2, file$3, 23, 4, 560);
    			attr_dev(div3, "class", "navbar-menu svelte-1utiny7");
    			add_location(div3, file$3, 22, 2, 529);
    			attr_dev(nav, "class", "navbar is-info is-light");
    			attr_dev(nav, "role", "navigation");
    			attr_dev(nav, "aria-label", "main navigation");
    			add_location(nav, file$3, 15, 0, 333);
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

    			current = true;
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
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(div2, null);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(nav);
    			destroy_each(each_blocks, detaching);
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
    	const routes = [
    		{ name: "main", path: "/" },
    		{
    			name: "about",
    			path: "/about",
    			query: { name: "Rogerio " }
    		},
    		{
    			name: "posts",
    			path: "/posts",
    			match: /\/posts\/.+/g
    		}
    	];

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Nav> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Nav", $$slots, []);
    	$$self.$capture_state = () => ({ Link, routes });
    	return [routes];
    }

    class Nav extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Nav",
    			options,
    			id: create_fragment$4.name
    		});
    	}
    }

    /* src\RouterParams.svelte generated by Svelte v3.20.1 */

    const file$4 = "src\\RouterParams.svelte";

    function create_fragment$5(ctx) {
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
    			add_location(hr, file$4, 9, 0, 118);
    			attr_dev(h2, "class", "subtitle");
    			add_location(h2, file$4, 10, 0, 126);
    			add_location(pre, file$4, 12, 0, 179);
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
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, { route: 1, params: 2, query: 3 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "RouterParams",
    			options,
    			id: create_fragment$5.name
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
    const file$5 = "src\\Main.svelte";

    function create_fragment$6(ctx) {
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
    			add_location(h1, file$5, 5, 0, 112);
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
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props, $$invalidate) {
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
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, { route: 0, params: 1, query: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Main",
    			options,
    			id: create_fragment$6.name
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
    const file$6 = "src\\About.svelte";

    function create_fragment$7(ctx) {
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
    			add_location(h1, file$6, 5, 0, 112);
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
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$7($$self, $$props, $$invalidate) {
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
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, { route: 0, params: 1, query: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "About",
    			options,
    			id: create_fragment$7.name
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
    const file$7 = "src\\Posts.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[4] = list[i];
    	return child_ctx;
    }

    // (18:10) <Link to="post" params={{ id: post.id }}>
    function create_default_slot$1(ctx) {
    	let t0;
    	let t1_value = /*post*/ ctx[4].id + "";
    	let t1;

    	const block = {
    		c: function create() {
    			t0 = text("Post number ");
    			t1 = text(t1_value);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t0, anchor);
    			insert_dev(target, t1, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(t1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$1.name,
    		type: "slot",
    		source: "(18:10) <Link to=\\\"post\\\" params={{ id: post.id }}>",
    		ctx
    	});

    	return block;
    }

    // (16:6) {#each posts as post}
    function create_each_block$1(ctx) {
    	let div;
    	let t;
    	let current;

    	const link = new Link({
    			props: {
    				to: "post",
    				params: { id: /*post*/ ctx[4].id },
    				$$slots: { default: [create_default_slot$1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(link.$$.fragment);
    			t = space();
    			attr_dev(div, "class", "panel-block has-text-centered");
    			add_location(div, file$7, 16, 8, 531);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(link, div, null);
    			append_dev(div, t);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const link_changes = {};

    			if (dirty & /*$$scope*/ 128) {
    				link_changes.$$scope = { dirty, ctx };
    			}

    			link.$set(link_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(link.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(link.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(link);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(16:6) {#each posts as post}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$8(ctx) {
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

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

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
    			add_location(h1, file$7, 10, 0, 291);
    			attr_dev(div0, "class", "panel-heading");
    			add_location(div0, file$7, 14, 6, 449);
    			attr_dev(div1, "class", "panel");
    			add_location(div1, file$7, 13, 4, 422);
    			attr_dev(div2, "class", "column is-one-third is-offset-one-third");
    			add_location(div2, file$7, 12, 2, 363);
    			attr_dev(div3, "class", "columns");
    			add_location(div3, file$7, 11, 0, 338);
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
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(div1, null);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}

    			const routerparams_changes = {};
    			if (dirty & /*route*/ 1) routerparams_changes.route = /*route*/ ctx[0];
    			if (dirty & /*params*/ 2) routerparams_changes.params = /*params*/ ctx[1];
    			if (dirty & /*query*/ 4) routerparams_changes.query = /*query*/ ctx[2];
    			routerparams.$set(routerparams_changes);
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			transition_in(routerparams.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

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
    		id: create_fragment$8.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$8($$self, $$props, $$invalidate) {
    	let { route } = $$props, { params } = $$props, { query } = $$props;

    	const posts = [...Array(5).keys()].map(key => ({
    		id: key + 1,
    		description: "post number " + String(key + 1)
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
    		Link,
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
    		init(this, options, instance$8, create_fragment$8, safe_not_equal, { route: 0, params: 1, query: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Posts",
    			options,
    			id: create_fragment$8.name
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
    const file$8 = "src\\Post.svelte";

    function create_fragment$9(ctx) {
    	let h1;
    	let t0;
    	let t1_value = /*params*/ ctx[0].id + "";
    	let t1;
    	let t2;
    	let t3;
    	let button;
    	let t5;
    	let current;
    	let dispose;

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
    			button = element("button");
    			button.textContent = "Go Back";
    			t5 = space();
    			create_component(routerparams.$$.fragment);
    			attr_dev(h1, "class", "title");
    			add_location(h1, file$8, 6, 0, 166);
    			attr_dev(button, "class", "button is-primary");
    			add_location(button, file$8, 7, 0, 231);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor, remount) {
    			insert_dev(target, h1, anchor);
    			append_dev(h1, t0);
    			append_dev(h1, t1);
    			append_dev(h1, t2);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, button, anchor);
    			insert_dev(target, t5, anchor);
    			mount_component(routerparams, target, anchor);
    			current = true;
    			if (remount) dispose();
    			dispose = listen_dev(button, "click", /*click_handler*/ ctx[3], false, false, false);
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
    			if (detaching) detach_dev(button);
    			if (detaching) detach_dev(t5);
    			destroy_component(routerparams, detaching);
    			dispose();
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
    	let { params } = $$props, { query } = $$props, { route } = $$props;
    	const writable_props = ["params", "query", "route"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Post> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Post", $$slots, []);

    	const click_handler = () => {
    		navigate("posts");
    	};

    	$$self.$set = $$props => {
    		if ("params" in $$props) $$invalidate(0, params = $$props.params);
    		if ("query" in $$props) $$invalidate(1, query = $$props.query);
    		if ("route" in $$props) $$invalidate(2, route = $$props.route);
    	};

    	$$self.$capture_state = () => ({
    		params,
    		query,
    		route,
    		navigate,
    		RouterParams
    	});

    	$$self.$inject_state = $$props => {
    		if ("params" in $$props) $$invalidate(0, params = $$props.params);
    		if ("query" in $$props) $$invalidate(1, query = $$props.query);
    		if ("route" in $$props) $$invalidate(2, route = $$props.route);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [params, query, route, click_handler];
    }

    class Post extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$9, create_fragment$9, safe_not_equal, { params: 0, query: 1, route: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Post",
    			options,
    			id: create_fragment$9.name
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

    function create_fragment$a(ctx) {
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
    		id: create_fragment$a.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$a($$self, $$props, $$invalidate) {
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
    			path: "/posts/:id",
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
    		init(this, options, instance$a, create_fragment$a, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Router_1",
    			options,
    			id: create_fragment$a.name
    		});
    	}
    }

    /* src\App.svelte generated by Svelte v3.20.1 */
    const file$9 = "src\\App.svelte";

    function create_fragment$b(ctx) {
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
    			add_location(div0, file$9, 9, 6, 192);
    			attr_dev(div1, "class", "hero-body");
    			add_location(div1, file$9, 8, 4, 162);
    			attr_dev(div2, "class", "hero is-fullheight-with-navbar");
    			add_location(div2, file$9, 7, 2, 113);
    			add_location(main, file$9, 5, 0, 94);
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
    		id: create_fragment$b.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$b($$self, $$props, $$invalidate) {
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
    		init(this, options, instance$b, create_fragment$b, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$b.name
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
