/**
 * Created by ricgillams on 14/06/2018.
 */

import React from "react";
import {connect} from "react-redux";
import ReactModal from "react-modal";

const customStyles = {
    overlay : {
        zIndex: 50,
        backgroundColor: 'rgba(0, 0, 0, 0.85)'
    },
    content : {
        top: '5%',
        left: '5%',
        right: '5%',
        bottom: '5%',
        marginRight: '-20%',
        transform: 'translate(-50%, -50%)',
        border: '10px solid #7a7a7a',
        width: '90%',
        height:'90%'
    }
};

export class ModalFragspectLoading extends React.Component {
    constructor(props) {
        super(props);
    }

    componentWillMount() {
        ReactModal.setAppElement('body')
    }

    render() {
        return (
            <div>
                <ReactModal isOpen={this.props.fragspectLoadingState} style={customStyles}>
                    <div>
                        <img src={ require('../img/fragspectLogo_v0.3.png')} width="494" height="349" />
                    </div>
                </ReactModal>
            </div>
        );
    }
}

function mapStateToProps(state) {
    return {
        fragspectLoadingState: state.apiReducers.present.fragspectLoadingState
    }
}

const mapDispatchToProps = {
}

export default connect(mapStateToProps, mapDispatchToProps)(ModalFragspectLoading);
