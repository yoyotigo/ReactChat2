import React from "react";
import axios from "axios";
import classNames from 'classnames';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TablePagination from '@material-ui/core/TablePagination';
import TableRow from '@material-ui/core/TableRow';
import TableSortLabel from '@material-ui/core/TableSortLabel';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import Paper from '@material-ui/core/Paper';
import Modal from 'react-awesome-modal';
import Tooltip from '@material-ui/core/Tooltip';
import { lighten } from '@material-ui/core/styles/colorManipulator';
import Checkbox from '@material-ui/core/Checkbox';
import IconButton from '@material-ui/core/IconButton';
import DeleteIcon from '@material-ui/icons/Delete';
import FilterListIcon from '@material-ui/icons/FilterList';
import Popup from "reactjs-popup";
 const desc=(a, b, orderBy)=>{
  if (b[orderBy] < a[orderBy]) {
    return -1;
  }
  if (b[orderBy] > a[orderBy]) {
    return 1;
  }
  return 0;
}

const stableSort=(array, cmp)=> {
  const stabilizedThis = array.map((el, index) => [el, index]);
  stabilizedThis.sort((a, b) => {
    const order = cmp(a[0], b[0]);
    if (order !== 0) return order;
    return a[1] - b[1];
  });
  return stabilizedThis.map(el => el[0]);
}

const getSorting=(order, orderBy)=>{
  return order === 'desc' ? (a, b) => desc(a, b, orderBy) : (a, b) => -desc(a, b, orderBy);
}

const rows = [
  { id: 'id', numeric: false, disablePadding: true, label: 'Row ID' },
  { id: 'room', numeric: true, disablePadding: false, label: 'Room' },
  { id: 'created', numeric: true, disablePadding: false, label: 'Created' },
  { id: 'edited', numeric: true, disablePadding: false, label: 'Edited' },
  { id: 'status', numeric: true, disablePadding: false, label: 'Status' },
  { id: 'Edit', numeric: true, disablePadding: false, button: 'Edit' },
];

class RoomHeader extends React.Component {
  createSortHandler = property => room => {
    this.props.onRequestSort(room, property);
  };

  render() {
    //const {order, orderBy} = this.props;
    const { onSelectAllClick, order, orderBy, numSelected, rowCount } = this.props;
    return (
      <TableHead>
        <TableRow>
        <TableCell padding="checkbox">
            <Checkbox
              indeterminate={numSelected > 0 && numSelected < rowCount}
              checked={numSelected === rowCount}
              onChange={onSelectAllClick}
            />
          </TableCell>
          {rows.map(
            row => (
              <TableCell
                key={row.id}
                align='right'
                padding={row.disablePadding ? 'none' : 'default'}
                sortDirection={orderBy === row.id ? order : false}
              >
                <Tooltip
                  title="Sort"
                  placement={row.numeric ? 'bottom-end' : 'bottom-start'}
                  enterDelay={300}
                >
                  <TableSortLabel
                    active={orderBy === row.id}
                    direction={order}
                    onClick={this.createSortHandler(row.id)}
                  >
                    {row.label}
                  </TableSortLabel>
                </Tooltip>
              </TableCell>
            ),
            this,
          )}
        </TableRow>
      </TableHead>
    );
  }
}
RoomHeader.propTypes = {
  numSelected: PropTypes.number.isRequired,
  onRequestSort: PropTypes.func.isRequired,
  onSelectAllClick: PropTypes.func.isRequired,
  order: PropTypes.string.isRequired,
  orderBy: PropTypes.string.isRequired,
  rowCount: PropTypes.number.isRequired,
};

const toolbarStyles = theme => ({
  root: {
    paddingRight: theme.spacing.unit,
  },
  highlight:
    theme.palette.type === 'light'
      ? {
          color: theme.palette.secondary.main,
          backgroundColor: lighten(theme.palette.secondary.light, 0.85),
        }
      : {
          color: theme.palette.text.primary,
          backgroundColor: theme.palette.secondary.dark,
        },
  spacer: {
    flex: '1 1 100%',
  },
  actions: {
    color: theme.palette.text.secondary,
  },
  title: {
    flex: '0 0 auto',
  },
});

let EnhancedTableToolbar = props => {
  const { numSelected, classes, delId } = props;

  return (
    <Toolbar
      className={classNames(classes.root, {
        [classes.highlight]: numSelected > 0,
      })}
    ><div className={classes.title}>
    {numSelected > 0 ? (
      <Typography color="inherit" variant="subtitle1">
        {numSelected} selected
      </Typography>
    ) : (
      <Typography variant="h6" id="tableTitle">
        Rooms Table
      </Typography>
    )}
  </div>
  <div className={classes.spacer} />
  <div className={classes.actions}>
    {numSelected > 0 ? (
      <Tooltip title="Delete">
        <button onClick={delId}>
          <DeleteIcon /></button>
      </Tooltip>
    ) : (
      <Tooltip title="Filter list">
        <IconButton aria-label="Filter list">
          <FilterListIcon />
        </IconButton>
      </Tooltip>
    )}
  </div>
    </Toolbar>
  );
};

EnhancedTableToolbar.propTypes = {
  classes: PropTypes.object.isRequired,
  numSelected: PropTypes.number.isRequired,
};
EnhancedTableToolbar = withStyles(toolbarStyles)(EnhancedTableToolbar);
const styles = theme => ({
  root: {
    width: '100%',
    marginTop: theme.spacing.unit * 3,
  },
  table: {
    minWidth: 1020,
  },
  tableWrapper: {
    overflowX: 'auto',
  },
});
////////////////////////////////////////////////////////////////////////////////////////////////////////////
/*let id=0
  function createData(room, created, edited, status){
    id+=1
    return {id: id,room, created, edited, status};
  }*/
class Room extends React.Component{
  
  constructor(props) {
    super(props);
    this.openModal=this.openModal.bind(this)  
    this.closeModal=this.closeModal.bind(this) 
}    
  
  state = {
    order: 'asc',
    orderBy: 'id',
    selected: [],
    data: [],
    page: 0,
    rowsPerPage: 5,
    visible: false,
    id:'',
    status:'Active'
  };
  componentDidMount(){
    axios.get("http://localhost:5000/api/room")
    .then(hist => {
      this.setState({data: hist.data})
    })
  }
  handleRequestSort = (event, property) => {
    const orderBy = property;
    let order = 'desc';
    if (this.state.orderBy === property && this.state.order === 'desc') {
      order = 'asc';
    }
    this.setState({ order, orderBy });
  };
  handleSelectAllClick = event => {
    if (event.target.checked) {
      this.setState(state => ({ selected: state.data.map(n => n.id) }));
      return;
    }
    this.setState({ selected: [] });
  }
  handleSelectAllClick = event => {
    if (event.target.checked) {
      this.setState(state => ({ selected: state.data.map(n => n.id) }));
      return;
    }
    this.setState({ selected: [] });
  };

  handleClick = (event, id, eid) => {
    const { selected } = this.state;
    const selectedIndex = selected.indexOf(id);
    let newSelected = [];
    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selected, id);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selected.slice(1));
    } else if (selectedIndex === selected.length - 1) {
      newSelected = newSelected.concat(selected.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(
        selected.slice(0, selectedIndex),
        selected.slice(selectedIndex + 1),
      );
    }

    this.setState({ selected: newSelected, id:eid });
  };
  isSelected = id => this.state.selected.indexOf(id) !== -1;
  handleChangePage = (event, page) => {
    this.setState({ page });
  };

  handleUpdate= (eid, stat) => {
    // Array.prototype.filter returns new array
    // so we aren't mutating state here
    if(eid!=='5cb60f39425e3b7e58103e86'){
      axios.post('http://localhost:5000/api/room/update/'+eid, {
        status:stat
      })
      this.setState({selected: []})
    }else{
      alert('Cannot Update Main Chat Room')
    }

  };

  handleDelete= (eid) => {
    // Array.prototype.filter returns new array
    // so we aren't mutating state here
    const arrayCopy = this.state.data.filter((row) => {
      return row._id !== eid
    });
    if(eid!=='5cb60f39425e3b7e58103e86'){
      axios.get('http://localhost:5000/api/room/delete/'+eid)
      this.setState({data:arrayCopy,  selected: []})
    }else{
      alert('Cannot Delete Main Chat Room')
    }

  };

  handleChangeRowsPerPage = event => {
    this.setState({ rowsPerPage: event.target.value });
  };

  openModal(){
    this.setState({
      visible:true
    })
  }

  closeModal(){
    this.setState({
      visible:false
    })
  }


  render(){

    const { classes } = this.props;
    const { data, order, orderBy, id, selected, rowsPerPage, page, status } = this.state;
    const emptyRows = rowsPerPage - Math.min(rowsPerPage, data.length - page * rowsPerPage);
   /* let rows= []
    data.map(item=>{
      this.date=item['created'].substring(0,10)
      this.time=item['edited'].substring(11,16)
      return rows.push(createData(item['room'],this.date, this.time, item['status']))
    })*/
    this.selectStatus=(e)=>{
      e.prevetnDefault()
      this.setState({status:e.target.value})
    }
    return(
      <Paper className={classes.root}>
        <EnhancedTableToolbar numSelected={selected.length} delId={()=>this.handleDelete(id)}/>
        <div className={classes.tableWrapper}>

        <input type="button" value="Add Room" onClick={this.openModal}/>
            <Modal visible={this.state.visible} width="400" height="300" effect="fadeInUp" onClickAway={()=>this.closeModal}>
            <div>
                <form method="POST" action="/api/room">
                  <label>Room name: </label>
                  <input type='text' placeholder="Room name" name="room" required/>  <br></br>
                  <label>Status: &emsp;&emsp;&nbsp;&nbsp; </label>
                  <select id="sel1" name="status" required>
                  <option>Active</option>
                  <option>Inactive</option>
                  </select>
                  <input type="submit" value="submit"/>       
                </form>
                <button onClick={this.closeModal}>Close</button>
            </div>
            </Modal>

          <Table className={classes.table} aria-labelledby="tableTitle">
            <RoomHeader
              numSelected={selected.length}
              order={order}
              orderBy={orderBy}
              onSelectAllClick={this.handleSelectAllClick}
              onRequestSort={this.handleRequestSort}
              rowCount={data.length}
            />
            <TableBody>
              {stableSort(data, getSorting(order, orderBy))
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((n,i) => {
                  const isSelected = this.isSelected(i);
                  return (
                    <TableRow
                    hover
                    onClick={event => this.handleClick(event, i, n._id)}
                    role="checkbox"
                    aria-checked={isSelected}
                    tabIndex={-1}
                    key={i}
                    selected={isSelected}
                    >
                    <TableCell padding="checkbox">
                        <Checkbox checked={isSelected} />
                      </TableCell>
                      <TableCell align="right" component="th" scope="row" padding="none">
                      {i}
                      </TableCell>
                      <TableCell align="right">{n.room}</TableCell>
                      <TableCell align="right">{n.created}</TableCell>
                      <TableCell align="right">{n.edited}</TableCell>
                      <TableCell align="right">{n.status}</TableCell>
                                            
                      <TableCell>
                        <Popup trigger={<button>Edit</button>}>
                          <div>
                            <form >
                              <label>Room name: </label>
                              <input type='text' placeholder={n.room} name="room" />  
                              <br></br>
                              <label>Status: &emsp;&emsp;&nbsp;&nbsp; </label>
                              <select onChange={this.selectStatus}id="sel1" name="status" required>
                                <option value='Active'>Active</option>
                                <option value='Inactive'>Inactive</option>
                              </select>
                              <button type="submit" onClick={()=>this.handleUpdate(n._id, status)}>Submit</button>
                            </form>
                          </div>
                        </Popup> 
                      </TableCell>
                    </TableRow>
                  );
                })}
               {emptyRows > 0 && (
                <TableRow style={{ height: 49 * emptyRows }}>
                  <TableCell colSpan={6} />
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={data.length}
          rowsPerPage={rowsPerPage}
          page={page}
          backIconButtonProps={{
            'aria-label': 'Previous Page',
          }}
          nextIconButtonProps={{
            'aria-label': 'Next Page',
          }}
          onChangePage={this.handleChangePage}
          onChangeRowsPerPage={this.handleChangeRowsPerPage}
        />
      </Paper>
    )
  } 
}
Room.propTypes = {
  classes: PropTypes.object.isRequired,
};
export default withStyles(styles) (Room);