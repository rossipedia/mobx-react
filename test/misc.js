import React, { createElement } from "react"
import createClass from "create-react-class";
import ReactDOM from "react-dom"
import { mount, shallow } from "enzyme"
import test from "tape"
import * as mobx from "mobx"
import { observer } from "../"
import { createTestRoot } from "./index"

const testRoot = createTestRoot()

test("custom shouldComponentUpdate is not respected for observable changes (#50)", t => {
    let called = 0
    const x = mobx.observable(3)
    const C = observer(
        createClass({
            render: () => <div>value:{x.get()}</div>,
            shouldComponentUpdate: () => called++
        })
    )
    const wrapper = mount(<C />)
    t.equal(wrapper.find("div").text(), "value:3")
    t.equal(called, 0)
    x.set(42)
    t.equal(wrapper.find("div").text(), "value:42")
    t.equal(called, 0)
    t.end()
})

test("custom shouldComponentUpdate is not respected for observable changes (#50) - 2", t => {
    // TODO: shouldComponentUpdate is meaningless with observable props...., just show warning in component definition?
    let called = 0
    const y = mobx.observable(5)
    const C = observer(
        createClass({
            render() {
                return <div>value:{this.props.y}</div>
            },
            shouldComponentUpdate(nextProps) {
                called++
                return nextProps.y !== 42
            }
        })
    )
    const B = observer(
        createClass({
            render: () => (
                <span>
                    <C y={y.get()} />
                </span>
            )
        })
    )
    const wrapper = mount(<B />)
    t.equal(wrapper.find("div").text(), "value:5")
    t.equal(called, 0)

    y.set(6)
    t.equal(wrapper.find("div").text(), "value:6")
    t.equal(called, 1)

    y.set(42)
    // t.equal(wrapper.find('div').text(), 'value:6'); // not updated! TODO: fix
    t.equal(called, 2)

    y.set(7)
    t.equal(wrapper.find("div").text(), "value:7")
    t.equal(called, 3)

    t.end()
})

test("issue mobx 405", t => {
    function ExampleState() {
        mobx.extendObservable(this, {
            name: "test",
            get greetings() {
                return "Hello my name is " + this.name
            }
        })
    }

    const ExampleView = observer(
        createClass({
            render() {
                return (
                    <div>
                        <input
                            type="text"
                            onChange={e => (this.props.exampleState.name = e.target.value)}
                            value={this.props.exampleState.name}
                        />
                        <span>{this.props.exampleState.greetings}</span>
                    </div>
                )
            }
        })
    )

    const exampleState = new ExampleState()
    const wrapper = shallow(<ExampleView exampleState={exampleState} />)
    t.equal(wrapper.find("span").text(), "Hello my name is test")

    t.end()
})

test("#85 Should handle state changing in constructors", function(t) {
    const a = mobx.observable(2)
    const Child = observer(
        createClass({
            displayName: "Child",
            getInitialState() {
                a.set(3) // one shouldn't do this!
                return {}
            },
            render: () => <div>child:{a.get()} - </div>
        })
    )
    const ParentWrapper = observer(function Parent() {
        return (
            <span>
                <Child />parent:{a.get()}
            </span>
        )
    })
    ReactDOM.render(<ParentWrapper />, testRoot, () => {
        t.equal(testRoot.getElementsByTagName("span")[0].textContent, "child:3 - parent:2")
        a.set(5)
        setTimeout(() => {
            t.equal(testRoot.getElementsByTagName("span")[0].textContent, "child:5 - parent:5")
            a.set(7)
            setTimeout(() => {
                t.equal(testRoot.getElementsByTagName("span")[0].textContent, "child:7 - parent:7")
                testRoot.parentNode.removeChild(testRoot)
                t.end()
            }, 10)
        }, 10)
    })
})

test("testIsComponentReactive", t => {
    const C = observer(() => null )
    const wrapper = mount(<C />)
    const instance = wrapper.instance()

    t.equal(C.isMobXReactObserver, true)

    // instance is something different then the rendering reaction!
    t.equal(mobx.isObservable(instance), false)
    t.equal(mobx.isObservable(instance.render), true)

    mobx.extendObservable(instance, {})
    t.equal(mobx.isObservable(instance), true)

    t.end()
})

test("testGetDNode", t => {
    const C = observer(() => null)

    const wrapper = mount(<C />)
    t.ok(wrapper.instance().render.$mobx)
    t.ok(mobx.extras.getAtom(wrapper.instance().render))

    mobx.extendObservable(wrapper.instance(), {
        x: 3
    })
    t.notStrictEqual(mobx.extras.getAtom(wrapper.instance(), "x"), mobx.extras.getAtom(wrapper.instance().render))

    t.end()
})
