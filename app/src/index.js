import React from "react";
import Pusher from "pusher-js";

import { render } from "react-dom";

 const API_URL = 'http://localhost:9000/api/';

let itemId = 0;
let locked = false;
let i = 0;
let items = [];

const ItemsForm = ({ addItem, state, changeItem }) => {
  return (
    <div className="row">
      <div className="col-md-10 col-sm-10">
        <input
          className="form-control"
          type="text"
          value={state}
          onChange={changeItem}
        />
      </div>
      <div className="col-md-2 col-sm-2">
        <button
          type="button"
          className="btn btn-default btn-xl btn-block"
          onClick={() => {
            addItem();
          }}
        >
          Add item
        </button>
      </div>
    </div>
  );
};

const Item = ({
  typeView,
  item,
  keyId,
  dbClick,
  stateChange,
  stateEditItem,
  editKey,
  remove,
  isChecked,
  updateCheckbox
}) => {
  if (typeView === "label" || locked === true) {
    return (
      <li className="list-group-item clearfix">
        <label className="btn col-md-1 col-sm-1">
          <input
            type="checkbox"
            onChange={() => {
              updateCheckbox(keyId);
            }}
            checked={isChecked}
          />
        </label>
        <label
          key={keyId}
          onDoubleClick={() => {
            dbClick(keyId);
          }}
          className="btn"
        >
          {item}
        </label>
        <button
          type="button"
          className="btn pull-right"
          onClick={() => {
            remove(keyId);
          }}
        >
          Delete item
        </button>
      </li>
    );
  } else {
    locked = true;
    return (
      <li className="list-group-item clearfix form-inline">
        <label className="col-md-1 col-sm-1 btn">
          <input
            type="checkbox"
            onChange={() => {
              updateCheckbox(keyId);
            }}
            checked={isChecked}
          />
        </label>
        <label className="col-md-11 col-sm-11">
          <input
            type="text"
            value={stateEditItem}
            className="form-control"
            onKeyDown={event => {
              editKey(keyId, event);
            }}
            onChange={stateChange}
          />
        </label>
      </li>
    );
  }
};

const ItemsList = ({
  items,
  dbClick,
  stateChange,
  stateEditItem,
  editKey,
  remove,
  isChecked,
  updateCheckbox
}) => {
  const item = items.map(c => {
    return (
      <Item
        typeView={c.typeView}
        item={c.item}
        keyId={c.id}
        dbClick={dbClick}
        stateChange={stateChange}
        stateEditItem={stateEditItem}
        editKey={editKey}
        remove={remove}
        isChecked={c.isChecked}
        updateCheckbox={updateCheckbox}
      />
    );
  });
  return (
    <div className="col-md-12 col-sm-12">
      <ul className="list-group">{item}</ul>
    </div>
  );
};

const ItemsLeft = ({ items }) => {
  i = items.length;
  items.map(c => {
    if (c.isChecked === true) {
      return i--;
    }
  });
  return <div> {i} items left</div>;
};

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      items: [],
      inputItem: "",
      inputField: "",
      isChecked: false
    };
	
	this.addTask = this.addTask.bind(this);
	this.postTask = this.postTask.bind(this);
  }
  
	postTask(e) {
        if (!this.state.inputItem.length) {
          return;
        }
        const newTask = {
          task: this.state.inputItem
        };
		console.log(this.state.inputItem);
        fetch(API_URL + 'new', {
          method: 'post',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(newTask)
        }).then(console.log);
    }
	
	addTask(newTask) {
        this.setState(prevState => ({
          items: prevState.items.concat(newTask),
          task: ''
        }));
    }
	
	componentDidMount() {
        this.pusher = new Pusher('5495c71d5f7c19283597', {
      cluster: 'eu',
      encrypted: true,
        });
        this.channel = this.pusher.subscribe('tasks');

        this.channel.bind('insert', this.addTask);
        this.channel.bind('deleted', this.removeTask);
    }
  
  render() {
    return (
      <div className="container-fluid">
        <h1 className="text-center">{this.props.name}</h1>
        <ItemsForm
          addItem={this.postTask}
          stateItem={this.state.inputItem}
          changeItem={this.handleChange.bind(this)}
        />
        <div className="row">
          <ItemsList
            items={this.state.items}
            dbClick={this.onDoubleClick.bind(this)}
            stateChange={this.handleEditChange.bind(this)}
            stateEditItem={this.state.inputField}
            editKey={this.handleKeyPress.bind(this)}
            remove={this.deleteItem.bind(this)}
            updateCheckbox={this.updateCheckbox.bind(this)}
          />
        </div>
        <div className="input-group">
          <ItemsLeft items={this.state.items} />
          <div className="input-group-btn">
            <button
              className="btn btn-default btn-xl btn-block"
              onClick={this.activeItems.bind(this)}
            >
              Active Items
            </button>
          </div>
          <div className="input-group-btn">
            <button
              className="btn btn-default btn-xl btn-block"
              onClick={this.allItmes.bind(this)}
            >
              All Items
            </button>
          </div>
        </div>
      </div>
    );
  }

  updateCheckbox(e) {
    if (locked === false) {
      const index = this.state.items.findIndex(el => el.id === e);
      let states = this.state.items;
      let state = states[index];
      state.isChecked = !state.isChecked;
      states[index] = state;
      this.setState({ states });
    }
  }

  handleChange(e) {
    this.setState({ inputItem: e.target.value });
  }

  handleEditChange(e) {
    locked = false;
    this.setState({ inputField: e.target.value });
  }

  onDoubleClick(e) {
    if (locked === false) {
      const index = this.state.items.findIndex(el => el.id === e);
      let states = this.state.items;
      let state = states[index];
      state.typeView = "input";
      states[index] = state;
      this.setState({ inputField: state.item });
      this.setState({ states });
    }
  }

  handleKeyPress(keyId, e) {
    if (e.key === "Enter" && this.state.inputField !== "") {
      const state = this.state.items.find(el => el.id === keyId);
      state.typeView = "label";
      state.item = this.state.inputField;
      locked = false;
      this.setState({ state });
    }
  }

  addItem() {
    if (this.state.inputItem !== "") {
      itemId++;
      let filtered = false;
      if (this.state.items.length !== items.length) {
        filtered = true;
      }
      this.setState({ items }, function() {
        this.setState(
          {
            items: [
              ...this.state.items,
              {
                id: itemId,
                item: this.state.inputItem,
                typeView: "label",
                isChecked: false
              }
            ]
          },
          function() {
            this.setItems();
            if (filtered === true) {
              this.activeItems();
            }
          }
        );
      });
    }
  }

  setItems() {
    items = this.state.items;
  }

  activeItems() {
    this.setItems();
    this.setState({
      items: this.state.items.filter(el => el.isChecked === false)
    });
  }

  allItmes() {
    this.setState({ items });
  }

  deleteItem(e) {
    items = this.state.items.filter(el => el.id !== e);
    this.setState({
      items
    });
  }
}

render(<App name="List" />, document.getElementById("root"));
