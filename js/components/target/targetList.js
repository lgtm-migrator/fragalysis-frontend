/**
 * Created by abradley on 13/03/2018.
 */

import React, { memo, useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { ListItemText, ListItemSecondaryAction, Grid } from '@material-ui/core';
import { List, ListItem, Panel } from '../common';
import { Link } from 'react-router-dom';
import { URLS } from '../routes/constants';
import { isDiscourseAvailable, generateDiscourseTargetURL } from '../../utils/discourse';
import { setTargetDiscourseLinks } from './redux/actions';
import { setOpenDiscourseErrorModal } from '../../reducers/api/actions';

export const TargetList = memo(() => {
  const dispatch = useDispatch();
  const isTargetLoading = useSelector(state => state.targetReducers.isTargetLoading);
  const target_id_list = useSelector(state => state.apiReducers.target_id_list);
  const targetDiscourseLinks = useSelector(state => state.targetReducers.targetDiscourseLinks);

  useEffect(() => {
    if (isDiscourseAvailable() && !targetDiscourseLinks) {
      const tempLinks = {};
      processTargetItem(tempLinks, target_id_list, 0);
    }
  }, [target_id_list, targetDiscourseLinks, dispatch, processTargetItem]);

  const processTargetItem = useCallback(
    (links, sourceData, index) => {
      if (sourceData && sourceData.length >= index + 1) {
        const data = sourceData[index];
        generateDiscourseTargetURL(data.title)
          .then(response => {
            links[data.id] = response.data['Post url'];
            dispatch(setTargetDiscourseLinks(links));
            processTargetItem(links, sourceData, index + 1);
          })
          .catch(err => {
            console.log(err);
            dispatch(setOpenDiscourseErrorModal(true));
          });
      }
    },
    [dispatch]
  );

  const render_method = data => {
    const preview = URLS.target + data.title;
    const sgcUrl = 'https://thesgc.org/sites/default/files/XChem/' + data.title + '/html/index.html';
    const sgcUploaded = ['BRD1A', 'DCLRE1AA', 'FALZA', 'FAM83BA', 'HAO1A', 'NUDT4A', 'NUDT5A', 'NUDT7A', 'PARP14A'];
    const discourseAvailable = isDiscourseAvailable();
    // const [discourseUrl, setDiscourseUrl] = useState();

    return (
      <ListItem key={data.id}>
        <Link to={preview}>
          <ListItemText primary={data.title} />
        </Link>
        <ListItemSecondaryAction>
          <Grid container direction="column" justify="center" alignItems="flex-start">
            {sgcUploaded.includes(data.title) && (
              <a href={sgcUrl} target="new">
                Open SGC summary
              </a>
            )}
            {discourseAvailable && targetDiscourseLinks?.hasOwnProperty(data.id) && (
              <a href={targetDiscourseLinks[data.id]} target="new">
                Discourse
              </a>
            )}
          </Grid>
        </ListItemSecondaryAction>
      </ListItem>
    );
  };

  if (target_id_list) {
    return (
      <Panel hasHeader title="Target List" isLoading={isTargetLoading}>
        <List>{target_id_list.map(data => render_method(data))}</List>
      </Panel>
    );
  } else {
    return <h1>FILL ME UP PLEASE</h1>;
  }
});
