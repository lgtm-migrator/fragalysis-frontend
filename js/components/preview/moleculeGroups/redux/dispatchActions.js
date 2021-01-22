import {
  complexObjectTypes,
  generateComplex,
  generateMolecule,
  generateSphere
} from '../../molecule/molecules_helpers';
import { VIEWS } from '../../../../constants/constants';
import {
  decrementCountOfRemainingMoleculeGroupsWithSavingDefaultState,
  deleteObject,
  loadObject
} from '../../../../reducers/ngl/dispatchActions';
import {
  removeFromComplexList,
  removeFromProteinList,
  removeFromSurfaceList,
  removeFromFragmentDisplayList,
  removeFromVectorOnList,
  resetSelectionState,
  setComplexList,
  setFilter,
  setFragmentDisplayList,
  setMolGroupSelection,
  setObjectSelection,
  setVectorList,
  setVectorOnList
} from '../../../../reducers/selection/actions';
import { setCountOfRemainingMoleculeGroups, setMoleculeOrientations } from '../../../../reducers/ngl/actions';
import { setMolGroupList, setMolGroupOn, setMolGroupOff } from '../../../../reducers/api/actions';
import { getUrl, loadFromServer } from '../../../../utils/genericList';
import { OBJECT_TYPE } from '../../../nglView/constants';
import { setSortDialogOpen } from '../../molecule/redux/actions';
import { resetCurrentCompoundsSettings } from '../../compounds/redux/actions';
import { reloadSession } from '../../../snapshot/redux/dispatchActions';
import { resetRestoringState } from '../../../../reducers/tracking/dispatchActions';
import { selectJoinedMoleculeList } from '../../molecule/redux/selectors';
import { URLS } from '../../../routes/constants';

export const clearAfterDeselectingMoleculeGroup = ({ molGroupId, currentMolGroup, majorViewStage }) => (
  dispatch,
  getState
) => {
  dispatch(setObjectSelection([molGroupId]));

  let site;
  const state = getState();
  const { fragmentDisplayList, complexList, proteinList, surfaceList, vectorOnList, vector_list } = state.selectionReducers;

  const actionFragmentDisplayList = [];
  const actionComplexList = [];
  const actionProteinList = [];
  const actionSurfaceList = [];
  const actionVectorOnList = [];

  // loop through all molecules
  selectJoinedMoleculeList(state).forEach(mol => {
    site = mol.site;

    // remove Ligand
    dispatch(
      deleteObject(
        Object.assign({ display_div: VIEWS.MAJOR_VIEW }, generateMolecule(mol.protein_code, mol.sdf_info)),
        majorViewStage
      )
    );

    // remove Complex, Protein, Surface
    Object.keys(complexObjectTypes).forEach(type => {
      dispatch(
        deleteObject(
          Object.assign(
            { display_div: VIEWS.MAJOR_VIEW },
            generateComplex(mol.protein_code, mol.sdf_info, mol.molecule_protein, type)
          ),
          majorViewStage
        )
      );
    });

    if (fragmentDisplayList.find(ligand => ligand === mol.id)) actionFragmentDisplayList.push(mol);
    if (complexList.find(ligand => ligand === mol.id)) actionComplexList.push(mol);
    if (proteinList.find(ligand => ligand === mol.id)) actionProteinList.push(mol);
    if (surfaceList.find(ligand => ligand === mol.id)) actionSurfaceList.push(mol);
    if (vectorOnList.find(ligand => ligand === mol.id)) actionVectorOnList.push(mol);
  });
  dispatch(setMolGroupOff(molGroupId, {
    ligand: actionFragmentDisplayList,
    protein: actionProteinList,
    complex: actionComplexList,
    surface: actionSurfaceList,
    vector: actionVectorOnList
  }));

  // remove all Vectors
  vector_list
    .filter(v => v.site === site)
    .forEach(item => {
      dispatch(deleteObject(Object.assign({ display_div: VIEWS.MAJOR_VIEW }, item), majorViewStage));
    });

  dispatch(setObjectSelection(undefined));

  // remove all molecule orientations
  dispatch(setMoleculeOrientations({}));

  // remove all selected ALCV of given site
  currentMolGroup.mol_id.forEach(moleculeID => {
    // remove Ligand, Complex, Vectors from selection
    //Ligand
    dispatch(removeFromFragmentDisplayList({ id: moleculeID }, true));
    // Complex
    dispatch(removeFromComplexList({ id: moleculeID }, true));
    // Protein
    dispatch(removeFromProteinList({ id: moleculeID }, true));
    // Surface
    dispatch(removeFromSurfaceList({ id: moleculeID }, true));
    // Vectors
    dispatch(removeFromVectorOnList({ id: moleculeID }, true));
  });
};

export const saveMoleculeGroupsToNglView = (molGroupList, stage, projectId) => dispatch => {
  if (molGroupList) {
    dispatch(setCountOfRemainingMoleculeGroups(molGroupList.length));
    molGroupList.map(data =>
      dispatch(
        loadObject({ target: Object.assign({ display_div: VIEWS.SUMMARY_VIEW }, generateSphere(data)), stage })
      ).then(() => dispatch(decrementCountOfRemainingMoleculeGroupsWithSavingDefaultState(projectId, stage)))
    );
  }
};

export const saveMoleculeGroupsToNglViewWithoutProject = (molGroupList, stage) => dispatch => {
  if (molGroupList) {
    molGroupList.map(data =>
      dispatch(loadObject({ target: Object.assign({ display_div: VIEWS.SUMMARY_VIEW }, generateSphere(data)), stage }))
    );
  }
};

export const selectMoleculeGroup = (moleculeGroup, summaryViewStage) => (dispatch, getState) => {
  const state = getState();
  const moleculeGroupSelection = state.selectionReducers.mol_group_selection.slice();
  const currentMolGroupStringID = `${OBJECT_TYPE.MOLECULE_GROUP}_${moleculeGroup.id}`;
  // update redux states
  dispatch(setMolGroupOn(moleculeGroup.id));
  moleculeGroupSelection.push(moleculeGroup.id);
  dispatch(setMolGroupSelection(moleculeGroupSelection));
  // re-render molecule group in NGL summary view
  dispatch(
    deleteObject(
      {
        display_div: VIEWS.SUMMARY_VIEW,
        name: currentMolGroupStringID
      },
      summaryViewStage
    )
  );
  dispatch(
    loadObject({
      target: Object.assign({ display_div: VIEWS.SUMMARY_VIEW }, generateSphere(moleculeGroup, true)),
      stage: summaryViewStage
    })
  );
};

export const selectFirstMolGroup = ({ summaryView }) => (dispatch, getState) => {
  const currentMolGroup = getState().apiReducers.mol_group_list[0];
  if (currentMolGroup) {
    dispatch(selectMoleculeGroup(currentMolGroup, summaryView));
  }
};

export const loadMoleculeGroups = ({ summaryView, setOldUrl, oldUrl, onCancel, isStateLoaded, projectId }) => (
  dispatch,
  getState
) => {
  const state = getState();
  const group_type = state.apiReducers.group_type;
  const target_on = state.apiReducers.target_on;
  const list_type = OBJECT_TYPE.MOLECULE_GROUP;

  if (target_on && !isStateLoaded) {
    return loadFromServer({
      url: getUrl({ list_type, target_on, group_type }),
      setOldUrl: url => setOldUrl(url),
      old_url: oldUrl,
      afterPush: data_list => dispatch(saveMoleculeGroupsToNglView(data_list, summaryView, projectId)),
      list_type,
      setObjectList: mol_group_list => {
        mol_group_list.sort((a, b) => a.id - b.id);
        dispatch(setMolGroupList(mol_group_list));
      },
      cancel: onCancel
    });
  } else if (target_on && isStateLoaded) {
    // to enable user interaction with application
    dispatch(setCountOfRemainingMoleculeGroups(0));
  }
  return Promise.resolve();
};

export const loadMoleculeGroupsOfTarget = ({ summaryView, setOldUrl, isStateLoaded, target_on }) => (
  dispatch,
  getState
) => {
  const state = getState();
  const group_type = state.apiReducers.group_type;
  const list_type = OBJECT_TYPE.MOLECULE_GROUP;

  if (target_on && !isStateLoaded) {
    return loadFromServer({
      url: getUrl({ list_type, target_on, group_type }),
      afterPush: data_list => dispatch(saveMoleculeGroupsToNglViewWithoutProject(data_list, summaryView)),
      list_type,
      setOldUrl,
      setObjectList: mol_group_list => {
        mol_group_list.sort((a, b) => a.id - b.id);
        dispatch(setMolGroupList(mol_group_list));
      }
    });
  } else if (target_on && isStateLoaded) {
    // to enable user interaction with application
    dispatch(setCountOfRemainingMoleculeGroups(0));
  }
  return Promise.resolve();
};

export const clearMoleculeGroupSelection = ({ getNglView }) => (dispatch, getState) => {
  const state = getState();
  const molGroupList = state.apiReducers.mol_group_list;

  const majorViewStage = getNglView(VIEWS.MAJOR_VIEW) && getNglView(VIEWS.MAJOR_VIEW).stage;
  const summaryViewStage = getNglView(VIEWS.SUMMARY_VIEW) && getNglView(VIEWS.SUMMARY_VIEW).stage;

  molGroupList.forEach(moleculeGroup => {
    dispatch(
      onDeselectMoleculeGroup({ moleculeGroup, stageSummaryView: summaryViewStage, majorViewStage: majorViewStage })
    );
  });

  // Reset selection reducer
  // remove sites selection
  dispatch(setMolGroupOn(undefined));
  dispatch(setMolGroupSelection([]));

  // reset all selection state
  dispatch(resetSelectionState());

  // remove Ligand, Complex, Vectors from selection
  //Ligand
  dispatch(setFragmentDisplayList([]));
  // Complex
  dispatch(setComplexList([]));
  // Vectors
  dispatch(setVectorOnList([]));
  dispatch(setVectorList([]));

  // reset filter of molecules
  dispatch(setFilter(undefined));
  // close sort dialog
  dispatch(setSortDialogOpen(false));

  // reset compounds
  dispatch(resetCurrentCompoundsSettings(true));
};

export const restoreFromCurrentSnapshot = ({ nglViewList }) => (dispatch, getState) => {
  const snapshot = getState().projectReducers.currentSnapshot.data;
  dispatch(reloadSession(snapshot, nglViewList));
};

export const restoreSnapshotActions = ({ nglViewList, projectId, snapshotId, history }) => (dispatch, getState) => {
  dispatch(resetRestoringState(nglViewList));
  // Trigger react-router to get rid of snapshot just saved flag
  history.replace(`${URLS.projects}${projectId}/${snapshotId}`);
};

export const onDeselectMoleculeGroup = ({ moleculeGroup, stageSummaryView, majorViewStage }) => (
  dispatch,
  getState
) => {
  const state = getState();
  const mol_group_list = state.apiReducers.mol_group_list;
  const currentMolGroup = mol_group_list.find(o => o.id === moleculeGroup.id);
  const currentMolGroupStringID = `${OBJECT_TYPE.MOLECULE_GROUP}_${moleculeGroup.id}`;

  const mol_group_selection = state.selectionReducers.mol_group_selection;
  const selectionCopy = mol_group_selection.slice();
  const objIdx = mol_group_selection.indexOf(moleculeGroup.id);
  dispatch(
    clearAfterDeselectingMoleculeGroup({
      molGroupId: moleculeGroup.id,
      currentMolGroup,
      majorViewStage
    })
  );
  selectionCopy.splice(objIdx, 1);
  dispatch(
    deleteObject(
      {
        display_div: VIEWS.SUMMARY_VIEW,
        name: currentMolGroupStringID
      },
      stageSummaryView
    )
  );
  dispatch(
    loadObject({
      target: Object.assign({ display_div: VIEWS.SUMMARY_VIEW }, generateSphere(currentMolGroup, false)),
      stage: stageSummaryView
    })
  );
  dispatch(setMolGroupSelection(selectionCopy));
  if (selectionCopy.length > 0) {
    dispatch(setMolGroupOn(selectionCopy.slice(-1)[0]));
  } else {
    dispatch(setMolGroupOn(undefined));
  }
};

export const onSelectMoleculeGroup = ({ moleculeGroup, stageSummaryView, majorViewStage, selectGroup }) => (
  dispatch,
  getState
) => {
  const state = getState();
  const mol_group_list = state.apiReducers.mol_group_list;
  const mol_group_selection = state.selectionReducers.mol_group_selection;

  const objIdx = mol_group_selection.indexOf(moleculeGroup.id);
  const currentMolGroup = mol_group_list.find(o => o.id === moleculeGroup.id);

  if (selectGroup && objIdx === -1) {
    dispatch(selectMoleculeGroup(currentMolGroup, stageSummaryView));
  } else if (!selectGroup && objIdx > -1) {
    dispatch(onDeselectMoleculeGroup({ moleculeGroup, stageSummaryView, majorViewStage }));
  }
};
