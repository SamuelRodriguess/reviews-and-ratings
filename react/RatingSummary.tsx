import React, {
  FunctionComponent,
  Fragment,
  useContext,
  useEffect,
  useReducer,
} from 'react'
import ApolloClient, { ApolloQueryResult } from 'apollo-client'
import { NormalizedCacheObject } from 'apollo-cache-inmemory'
import { withApollo } from 'react-apollo'
import { ProductContext, Product } from 'vtex.product-context'
import Stars from './components/Stars'
import { generateBlockClass, BlockClass } from '@vtex/css-handles'
import styles from './styles.css'
import TotalReviewsByProductId from '../graphql/totalReviewsByProductId.graphql'
import AverageRatingByProductId from '../graphql/averageRatingByProductId.graphql'

interface Props {
  client: ApolloClient<NormalizedCacheObject>
}

interface TotalData {
  totalReviewsByProductId: number
}

interface AverageData {
  averageRatingByProductId: number
}

interface State {
  total: number
  average: number
  hasTotal: boolean
  hasAverage: boolean
}

type ReducerActions =
  | { type: 'SET_TOTAL'; args: { total: number } }
  | { type: 'SET_AVERAGE'; args: { average: number } }

const initialState = {
  total: 0,
  average: 0,
  hasTotal: false,
  hasAverage: false,
}

const reducer = (state: State, action: ReducerActions) => {
  switch (action.type) {
    case 'SET_TOTAL':
      return {
        ...state,
        total: action.args.total,
        hasTotal: true,
      }
    case 'SET_AVERAGE':
      return {
        ...state,
        average: action.args.average,
        hasAverage: true,
      }
  }
}

const RatingSummary: FunctionComponent<BlockClass & Props> = props => {
  const { blockClass, client } = props

  const baseClassNames = generateBlockClass(styles.summaryContainer, blockClass)
  const { product }: ProductContext = useContext(ProductContext)
  const { productId }: Product = product || {}

  const [state, dispatch] = useReducer(reducer, initialState)

  useEffect(() => {
    if (!productId) {
      return
    }

    client
      .query({
        query: TotalReviewsByProductId,
        variables: {
          productId: productId,
        },
      })
      .then((response: ApolloQueryResult<TotalData>) => {
        const total = response.data.totalReviewsByProductId
        dispatch({
          type: 'SET_TOTAL',
          args: { total },
        })
      })

    client
      .query({
        query: AverageRatingByProductId,
        variables: {
          productId: productId,
        },
      })
      .then((response: ApolloQueryResult<AverageData>) => {
        const average = response.data.averageRatingByProductId
        dispatch({
          type: 'SET_AVERAGE',
          args: { average },
        })
      })
  }, [client, productId])

  return (
    <div className={`${baseClassNames} review-summary mw8 center`}>
      {!state.hasTotal || !state.hasAverage ? (
        <Fragment>Loading reviews...</Fragment>
      ) : state.total == 0 ? null : (
        <Fragment>
          <span className="t-heading-4 v-mid">
            <Stars rating={state.average} />
          </span>{' '}
          <span className="review__rating--count dib v-mid">
            ({state.total})
          </span>
        </Fragment>
      )}
    </div>
  )
}

export default withApollo(RatingSummary)