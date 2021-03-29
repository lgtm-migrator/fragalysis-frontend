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
import { setOpenDiscourseErrorModal } from '../../reducers/api/actions';

export const TargetList = memo(() => {
  const dispatch = useDispatch();
  const isTargetLoading = useSelector(state => state.targetReducers.isTargetLoading);
  const target_id_list = useSelector(state => state.apiReducers.target_id_list);

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
            {discourseAvailable && (
              <a
                href=""
                target="new"
                onClick={() => {
                  generateDiscourseTargetURL(data.title)
                    .then(response => {
                      const link = response.data['Post url'];
                      window.open(link, '_blank');
                    })
                    .catch(err => {
                      console.log(err);
                      dispatch(setOpenDiscourseErrorModal(true));
                    });
                }}
              >
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
